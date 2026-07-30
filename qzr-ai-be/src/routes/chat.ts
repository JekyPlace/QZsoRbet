import { Router } from "express";
import { Identity, Prisma } from "../../generated/prisma/client.js";
import { buildConversationMemorySystemMessage } from "../lib/conversationMemory.brain.js";
import {
  buildDocumentSystemMessage,
  classifyUserIntent,
  MODEL_SYSTEM_MESSAGE,
  OUT_OF_SCOPE_RESPONSE,
  SENSITIVE_DATA_RESPONSE,
} from "../lib/prompt.brain.js";
import { prisma } from "../lib/prisma.js";
import {
  logRagDecision,
  logRagPrompt,
  selectRelevantDocumentContext,
} from "../lib/rag.brain.js";
import {
  prepareSseResponse,
  startSseHeartbeat,
  writeSse,
} from "../lib/sse.brain.js";
import { getOllamaModels, streamMessageFromAI } from "../services/ai.api.js";
import { refreshConversationMemory } from "../services/conversationMemory.api.js";
import { getRelevantCsvContext } from "../services/qdrant.api.js";
import { rewriteRetrievalQuery } from "../services/queryRewrite.api.js";
import type { AIMessage, MessageBody } from "../types/api.types.js";

const chatRouter = Router();
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_DEFAULT_MODEL ?? "gemma3:12b";

type SaveChatExchangeParams = {
  botContent: string;
  chatId?: string;
  label?: string;
  userContent: string;
  userTimestamp: Date;
};

async function saveChatExchange({
  botContent,
  chatId,
  label,
  userContent,
  userTimestamp,
}: SaveChatExchangeParams) {
  const messages = [
    {
      from: Identity.HUMAN,
      content: userContent,
      timestamp: userTimestamp,
    },
    {
      from: Identity.CHATBOT,
      content: botContent,
      timestamp: new Date(),
    },
  ];

  return chatId
    ? prisma.chat.update({
        where: { id: chatId },
        data: { messages: { create: messages } },
        include: { messages: { orderBy: { timestamp: "asc" } } },
      })
    : prisma.chat.create({
        data: {
          label: label?.trim() || "New chat",
          messages: { create: messages },
        },
        include: { messages: { orderBy: { timestamp: "asc" } } },
      });
}

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
    const userIntent = classifyUserIntent(userContent);

    if (userIntent === "sensitive_data" || userIntent === "personal_advice") {
      contentGenerated =
        userIntent === "sensitive_data"
          ? SENSITIVE_DATA_RESPONSE
          : OUT_OF_SCOPE_RESPONSE;

      const chat = await saveChatExchange({
        botContent: contentGenerated,
        chatId,
        label,
        userContent,
        userTimestamp: parsedTimestamp,
      });

      writeSse(response, "chunk", { content: contentGenerated });
      writeSse(response, "done", { chat });
      response.end();
      return;
    }

    const existingChat = chatId
      ? await prisma.chat.findUnique({
          where: { id: chatId },
          select: {
            conversationMemory: true,
            memoryMessageCount: true,
          },
        })
      : null;

    if (chatId && !existingChat) {
      writeSse(response, "error", { error: "Chat not found" });
      response.end();
      return;
    }

    const unsummarizedMessages = chatId
      ? await prisma.message.findMany({
          where: { chatId },
          orderBy: { timestamp: "asc" },
          skip: existingChat?.memoryMessageCount ?? 0,
          select: { from: true, content: true },
        })
      : [];
    const chronologicalMessages = unsummarizedMessages.map((message) => ({
      content: message.content,
      role:
        message.from === Identity.HUMAN
          ? ("user" as const)
          : ("assistant" as const),
    }));
    const conversationContext = await refreshConversationMemory({
      chatId,
      memoryMessageCount: existingChat?.memoryMessageCount,
      messages: chronologicalMessages,
      selectedModel,
      signal: abortController.signal,
      storedMemory: existingChat?.conversationMemory,
    });
    const rewrittenQuery = await rewriteRetrievalQuery({
      conversationMemory: conversationContext.memory,
      currentRequest: userContent,
      recentMessages: conversationContext.recentMessages,
      selectedModel,
      signal: abortController.signal,
    });
    const retrievalQuery = rewrittenQuery.query;
    const retrievedDocumentContext =
      await getRelevantCsvContext(retrievalQuery);
    const documentContext = selectRelevantDocumentContext(
      retrievedDocumentContext,
    );
    const isMissingDocumentContext =
      userIntent !== "identity" && documentContext.length === 0;

    logRagDecision({
      documentContext,
      isMissingDocumentContext,
      retrievedDocumentContext,
      retrievalQuery,
      userIntent,
    });

    if (isMissingDocumentContext) {
      contentGenerated = OUT_OF_SCOPE_RESPONSE;

      const chat = await saveChatExchange({
        botContent: contentGenerated,
        chatId,
        label,
        userContent,
        userTimestamp: parsedTimestamp,
      });

      writeSse(response, "chunk", { content: contentGenerated });
      writeSse(response, "done", { chat });
      response.end();
      return;
    }

    try {
      const availableModels = await getOllamaModels();
      const modelExists = availableModels.some(
        (availableModel) => availableModel.name === selectedModel,
      );

      if (!modelExists) {
        writeSse(response, "error", {
          error: `Model "${selectedModel}" is not available in Ollama`,
        });
        response.end();
        return;
      }
    } catch (error) {
      console.error("Failed to validate Ollama model", error);
      writeSse(response, "error", { error: "Failed to load Ollama models" });
      response.end();
      return;
    }

    const documentSystemMessage = buildDocumentSystemMessage(documentContext);

    const contextMessages: AIMessage[] = [
      MODEL_SYSTEM_MESSAGE,
      ...buildConversationMemorySystemMessage(conversationContext.memory),
      ...documentSystemMessage,
      ...conversationContext.recentMessages,
      {
        role: "user",
        content: userContent,
      },
    ];

    logRagPrompt(contextMessages);

    for await (const chunk of streamMessageFromAI(
      contextMessages,
      selectedModel,
      abortController.signal,
    )) {
      contentGenerated += chunk;
      writeSse(response, "chunk", { content: chunk });
    }

    const chat = await saveChatExchange({
      botContent: contentGenerated,
      chatId,
      label,
      userContent,
      userTimestamp: parsedTimestamp,
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
