import { Router, type Response } from "express";
import { Identity, Prisma } from "../../generated/prisma/client.js";
import {
  buildDocumentSystemMessage,
  isIdentityQuestion,
  MODEL_SYSTEM_MESSAGE,
  OUT_OF_SCOPE_RESPONSE,
  shouldRejectOutOfScopeQuestion,
} from "../lib/prompt.brain.js";
import { prisma } from "../lib/prisma.js";
import {
  buildRetrievalQuery,
  hasRelevantDocumentContext,
} from "../lib/rag.brain.js";
import {
  prepareSseResponse,
  startSseHeartbeat,
  writeSse,
} from "../lib/sse.brain.js";
import { getOllamaModels, streamMessageFromAI } from "../services/ai.api.js";
import { getRelevantCsvContext } from "../services/qdrant.api.js";
import type { AIMessage, MessageBody } from "../types/api.types.js";

const chatRouter = Router();
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_DEFAULT_MODEL ?? "gemma3:12b";

chatRouter.get("/:id", async (request, response) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: request.params.id },
      include: { messages: { orderBy: { timestamp: "asc" } } },
    });

    if (!chat) {
      response.status(404).json({ error: "Chat not found" });
      return;
    }

    response.json(chat);
  } catch (error) {
    console.error("Failed to get chat", error);
    response.status(500).json({ error: "Failed to get chat" });
  }
});

chatRouter.post("/message", async (request, response) => {
  const { chatId, label, content, model, timestamp } =
    request.body as MessageBody;

  if (!content?.trim()) {
    response.status(400).json({ error: "content is required" });
    return;
  }

  const selectedModel = model?.trim() || DEFAULT_OLLAMA_MODEL;

  try {
    const availableModels = await getOllamaModels();
    const modelExists = availableModels.some(
      (availableModel) => availableModel.name === selectedModel,
    );

    if (!modelExists) {
      response.status(400).json({
        error: `Model "${selectedModel}" is not available in Ollama`,
      });
      return;
    }
  } catch (error) {
    console.error("Failed to validate Ollama model", error);
    response.status(502).json({ error: "Failed to load Ollama models" });
    return;
  }

  const parsedTimestamp = timestamp ? new Date(timestamp) : new Date();

  if (Number.isNaN(parsedTimestamp.getTime())) {
    response.status(400).json({ error: "timestamp must be a valid date" });
    return;
  }

  prepareSseResponse(response);

  const abortController = new AbortController();
  const heartbeat = startSseHeartbeat(response);

  response.on("close", () => {
    clearInterval(heartbeat);
    if (!response.writableEnded) abortController.abort();
  });

  try {
    const userContent = content.trim();
    let contentGenerated = "";
    const previousMessages = chatId
      ? await prisma.message.findMany({
          where: { chatId },
          orderBy: { timestamp: "desc" },
          take: 20,
          select: { from: true, content: true },
        })
      : [];
    const recentUserContext = previousMessages
      .filter((message) => message.from === Identity.HUMAN)
      .slice(0, 3)
      .reverse()
      .map((message) => message.content);
    const retrievalQuery = buildRetrievalQuery(recentUserContext, userContent);
    const documentContext = await getRelevantCsvContext(retrievalQuery);

    if (
      shouldRejectOutOfScopeQuestion(userContent) ||
      (!isIdentityQuestion(userContent) &&
        !hasRelevantDocumentContext(documentContext))
    ) {
      contentGenerated = OUT_OF_SCOPE_RESPONSE;

      const messages = [
        {
          from: Identity.HUMAN,
          content: userContent,
          timestamp: parsedTimestamp,
        },
        {
          from: Identity.CHATBOT,
          content: contentGenerated,
          timestamp: new Date(),
        },
      ];

      const chat = chatId
        ? await prisma.chat.update({
            where: { id: chatId },
            data: { messages: { create: messages } },
            include: { messages: { orderBy: { timestamp: "asc" } } },
          })
        : await prisma.chat.create({
            data: {
              label: label?.trim() || "New chat",
              messages: { create: messages },
            },
            include: { messages: { orderBy: { timestamp: "asc" } } },
          });

      writeSse(response, "chunk", { content: contentGenerated });
      writeSse(response, "done", { chat });
      response.end();
      return;
    }

    const documentSystemMessage = buildDocumentSystemMessage(documentContext);

    const contextMessages: AIMessage[] = [
      MODEL_SYSTEM_MESSAGE,
      ...documentSystemMessage,
      ...previousMessages.reverse().map((message) => ({
        role:
          message.from === Identity.HUMAN
            ? ("user" as const)
            : ("assistant" as const),
        content: message.content,
      })),
      {
        role: "user",
        content: userContent,
      },
    ];

    for await (const chunk of streamMessageFromAI(
      contextMessages,
      selectedModel,
      abortController.signal,
    )) {
      contentGenerated += chunk;
      writeSse(response, "chunk", { content: chunk });
    }

    const messages = [
      {
        from: Identity.HUMAN,
        content: userContent,
        timestamp: parsedTimestamp,
      },
      {
        from: Identity.CHATBOT,
        content: contentGenerated,
        timestamp: new Date(),
      },
    ];

    const chat = chatId
      ? await prisma.chat.update({
          where: { id: chatId },
          data: { messages: { create: messages } },
          include: { messages: { orderBy: { timestamp: "asc" } } },
        })
      : await prisma.chat.create({
          data: {
            label: label?.trim() || "New chat",
            messages: { create: messages },
          },
          include: { messages: { orderBy: { timestamp: "asc" } } },
        });

    writeSse(response, "done", { chat });
    response.end();
  } catch (error) {
    if (abortController.signal.aborted) return;

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      writeSse(response, "error", { error: "Chat not found" });
      response.end();
      return;
    }

    console.error("Failed to save message", error);
    writeSse(response, "error", {
      error:
        error instanceof Error ? error.message : "Failed to generate message",
    });
    response.end();
  } finally {
    clearInterval(heartbeat);
  }
});

chatRouter.delete("/:id", async (req, res) => {
  try {
    const deletedChat = await prisma.chat.delete({
      where: {
        id: req.params.id,
      },
    });
    res.json(deletedChat);
  } catch (error) {
    console.error("Failed to delete chat", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

export default chatRouter;
