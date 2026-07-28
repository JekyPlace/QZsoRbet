import {
  buildQueryRewriteMessages,
  createQueryRewriteFallback,
  tryParseQueryRewrite,
  type QueryRewriteResult,
} from "../lib/queryRewrite.brain.js";
import { generateMessageFromAI } from "./ai.api.js";

const DEBUG_QUERY_REWRITE = process.env.DEBUG_QUERY_REWRITE === "true";
const OLLAMA_QUERY_REWRITE_MODEL =
  process.env.OLLAMA_QUERY_REWRITE_MODEL?.trim();
const QUERY_REWRITE_MAX_TOKENS = Number(
  process.env.QUERY_REWRITE_MAX_TOKENS ?? 300,
);
const QUERY_REWRITE_RECENT_MESSAGES = Number(
  process.env.QUERY_REWRITE_RECENT_MESSAGES ?? 8,
);
const QUERY_REWRITE_TIMEOUT_MS = Number(
  process.env.QUERY_REWRITE_TIMEOUT_MS ?? 15_000,
);

type RewriteConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

type RewriteRetrievalQueryParams = {
  currentRequest: string;
  recentMessages: RewriteConversationMessage[];
  selectedModel: string;
  signal?: AbortSignal;
};

type QueryRewriteLog = QueryRewriteResult & {
  durationMs: number;
  fallbackReason?: string;
  model: string;
  originalQuery: string;
};

function logQueryRewrite(data: QueryRewriteLog) {
  if (process.env.NODE_ENV === "production" || !DEBUG_QUERY_REWRITE) return;

  console.info("QUERY rewrite", data);
}

export async function rewriteRetrievalQuery({
  currentRequest,
  recentMessages,
  selectedModel,
  signal,
}: RewriteRetrievalQueryParams): Promise<QueryRewriteResult> {
  const startedAt = performance.now();
  const model = OLLAMA_QUERY_REWRITE_MODEL || selectedModel;
  const fallback = createQueryRewriteFallback(currentRequest);

  try {
    const output = await generateMessageFromAI(
      buildQueryRewriteMessages({
        currentRequest,
        recentMessages: recentMessages.slice(-QUERY_REWRITE_RECENT_MESSAGES),
      }),
      model,
      {
        format: "json",
        maxOutputTokens: QUERY_REWRITE_MAX_TOKENS,
        temperature: 0,
        timeoutMs: QUERY_REWRITE_TIMEOUT_MS,
      },
      signal,
    );
    const parsedResult = tryParseQueryRewrite(output);
    const result = parsedResult ?? fallback;

    logQueryRewrite({
      ...result,
      durationMs: Math.round(performance.now() - startedAt),
      fallbackReason: parsedResult ? undefined : "invalid_model_output",
      model,
      originalQuery: currentRequest,
    });

    return result;
  } catch (error) {
    logQueryRewrite({
      ...fallback,
      durationMs: Math.round(performance.now() - startedAt),
      fallbackReason:
        error instanceof Error ? error.message : "unknown_rewrite_error",
      model,
      originalQuery: currentRequest,
    });

    return fallback;
  }
}
