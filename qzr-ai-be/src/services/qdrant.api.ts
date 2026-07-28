import {
  selectBestRetrievalContext,
  shouldRetryRetrievalWithHint,
} from "../lib/retrievalFallback.brain.js";
import { searchRelevantCsvContext } from "../lib/qdrant.brain.js";
import type { DocumentContext } from "../types/api.types.js";

const QDRANT_FALLBACK_QUERY_HINT =
  process.env.QDRANT_FALLBACK_QUERY_HINT ?? "QZR";
const QDRANT_FALLBACK_MIN_TOP_SCORE = Number(
  process.env.QDRANT_FALLBACK_MIN_TOP_SCORE ??
    process.env.MIN_TOP_DOCUMENT_SCORE ??
    0.42,
);
const DEBUG_RAG = process.env.DEBUG_RAG === "true";

export async function getRelevantCsvContext(
  query: string,
): Promise<DocumentContext[]> {
  try {
    const context = await searchRelevantCsvContext(query);

    if (
      !shouldRetryRetrievalWithHint({
        context,
        hint: QDRANT_FALLBACK_QUERY_HINT,
        minTopScore: QDRANT_FALLBACK_MIN_TOP_SCORE,
      })
    ) {
      return context;
    }

    const hintedContext = await searchRelevantCsvContext(
      `${QDRANT_FALLBACK_QUERY_HINT.trim()}\n${query}`,
    );
    const selectedContext = selectBestRetrievalContext(
      context,
      hintedContext,
    );

    if (process.env.NODE_ENV !== "production" && DEBUG_RAG) {
      console.info("RAG fallback", {
        hint: QDRANT_FALLBACK_QUERY_HINT.trim(),
        hintedTopScore: hintedContext[0]?.score ?? null,
        initialTopScore: context[0]?.score ?? null,
        minTopScore: QDRANT_FALLBACK_MIN_TOP_SCORE,
        query,
        selected: selectedContext === hintedContext ? "hinted" : "initial",
      });
    }

    return selectedContext;
  } catch (error) {
    console.warn(
      "CSV context unavailable, continuing without document context:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
