import { Prisma } from "../../generated/prisma/client.js";
import {
  buildConversationMemoryMessages,
  EMPTY_CONVERSATION_MEMORY,
  parseStoredConversationMemory,
  partitionConversationMessages,
  tryParseConversationMemory,
  type ConversationMemory,
} from "../lib/conversationMemory.brain.js";
import { prisma } from "../lib/prisma.js";
import { generateMessageFromAI } from "./ai.api.js";

const DEBUG_CONVERSATION_MEMORY =
  process.env.DEBUG_CONVERSATION_MEMORY === "true";
const CONVERSATION_MEMORY_MAX_TOKENS = Number(
  process.env.CONVERSATION_MEMORY_MAX_TOKENS ?? 500,
);
const CONVERSATION_MEMORY_RECENT_MESSAGES = Number(
  process.env.CONVERSATION_MEMORY_RECENT_MESSAGES ?? 4,
);
const CONVERSATION_MEMORY_FALLBACK_MESSAGES = Number(
  process.env.CONVERSATION_MEMORY_FALLBACK_MESSAGES ?? 8,
);
const CONVERSATION_MEMORY_TIMEOUT_MS = Number(
  process.env.CONVERSATION_MEMORY_TIMEOUT_MS ?? 30_000,
);
const OLLAMA_CONVERSATION_MEMORY_MODEL =
  process.env.OLLAMA_CONVERSATION_MEMORY_MODEL?.trim();

type ConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

type RefreshConversationMemoryParams = {
  chatId?: string;
  memoryMessageCount?: number;
  messages: ConversationMessage[];
  selectedModel: string;
  signal?: AbortSignal;
  storedMemory?: unknown;
};

export type ConversationContext = {
  memory: ConversationMemory;
  memoryMessageCount: number;
  recentMessages: ConversationMessage[];
};

export async function refreshConversationMemory({
  chatId,
  memoryMessageCount = 0,
  messages,
  selectedModel,
  signal,
  storedMemory,
}: RefreshConversationMemoryParams): Promise<ConversationContext> {
  const currentMemory = chatId
    ? parseStoredConversationMemory(storedMemory)
    : EMPTY_CONVERSATION_MEMORY;
  const partition = partitionConversationMessages({
    memoryMessageCount: 0,
    messages,
    recentMessagesToKeep: CONVERSATION_MEMORY_RECENT_MESSAGES,
  });

  if (!chatId || partition.messagesToSummarize.length === 0) {
    return {
      memory: currentMemory,
      memoryMessageCount,
      recentMessages: partition.recentMessages,
    };
  }

  const startedAt = performance.now();
  const model = OLLAMA_CONVERSATION_MEMORY_MODEL || selectedModel;

  try {
    const output = await generateMessageFromAI(
      buildConversationMemoryMessages({
        currentMemory,
        messagesToSummarize: partition.messagesToSummarize,
      }),
      model,
      {
        format: "json",
        maxOutputTokens: CONVERSATION_MEMORY_MAX_TOKENS,
        temperature: 0,
        timeoutMs: CONVERSATION_MEMORY_TIMEOUT_MS,
      },
      signal,
    );
    const updatedMemory = tryParseConversationMemory(output);

    if (!updatedMemory) {
      throw new Error("invalid_model_output");
    }

    const targetMemoryMessageCount =
      memoryMessageCount + partition.targetMemoryMessageCount;

    await prisma.chat.updateMany({
      where: {
        id: chatId,
        memoryMessageCount,
      },
      data: {
        conversationMemory:
          updatedMemory as unknown as Prisma.InputJsonValue,
        memoryMessageCount: targetMemoryMessageCount,
      },
    });

    logConversationMemory({
      durationMs: Math.round(performance.now() - startedAt),
      memory: updatedMemory,
      model,
      newMessages: partition.messagesToSummarize.length,
      summarizedMessages: targetMemoryMessageCount,
      usedFallback: false,
    });

    return {
      memory: updatedMemory,
      memoryMessageCount: targetMemoryMessageCount,
      recentMessages: partition.recentMessages,
    };
  } catch (error) {
    logConversationMemory({
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "unknown_memory_error",
      memory: currentMemory,
      model,
      newMessages: partition.messagesToSummarize.length,
      summarizedMessages: memoryMessageCount,
      usedFallback: true,
    });

    return {
      memory: currentMemory,
      memoryMessageCount,
      recentMessages: messages.slice(-CONVERSATION_MEMORY_FALLBACK_MESSAGES),
    };
  }
}

function logConversationMemory(data: {
  durationMs: number;
  error?: string;
  memory: ConversationMemory;
  model: string;
  newMessages: number;
  summarizedMessages: number;
  usedFallback: boolean;
}) {
  if (
    process.env.NODE_ENV === "production" ||
    !DEBUG_CONVERSATION_MEMORY
  ) {
    return;
  }

  console.info("CONVERSATION memory", data);
}
