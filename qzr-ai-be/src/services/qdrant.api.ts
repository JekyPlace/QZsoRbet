import { searchRelevantCsvContext } from "../lib/qdrant.brain.js";
import type { DocumentContext } from "../types/api.types.js";

const QDRANT_FALLBACK_QUERY_HINT =
  process.env.QDRANT_FALLBACK_QUERY_HINT ?? "QZR";

export async function getRelevantCsvContext(
  query: string,
): Promise<DocumentContext[]> {
  try {
    const context = await searchRelevantCsvContext(query);

    if (context.length > 0 || !QDRANT_FALLBACK_QUERY_HINT.trim()) {
      return context;
    }

    return await searchRelevantCsvContext(
      `${QDRANT_FALLBACK_QUERY_HINT.trim()}\n${query}`,
    );
  } catch (error) {
    console.warn(
      "CSV context unavailable, continuing without document context:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
