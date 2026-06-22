import { createEmbeddings } from "./embedding.api.js";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "csv_documents";
const QDRANT_SEARCH_LIMIT = Number(process.env.QDRANT_SEARCH_LIMIT ?? 5);
const QDRANT_SCORE_THRESHOLD = Number(
  process.env.QDRANT_SCORE_THRESHOLD ?? 0.45,
);
const QDRANT_TIMEOUT_MS = Number(process.env.QDRANT_TIMEOUT_MS ?? 3000);
const QDRANT_FALLBACK_QUERY_HINT =
  process.env.QDRANT_FALLBACK_QUERY_HINT ?? "QZR";

type QdrantPayload = {
  text?: unknown;
  source?: unknown;
  rowStart?: unknown;
  rowEnd?: unknown;
};

type QdrantPoint = {
  score: number;
  payload?: QdrantPayload | null;
};

type QdrantQueryResponse = {
  result?: {
    points?: QdrantPoint[];
  };
};

export type DocumentContext = {
  text: string;
  source: string;
  rowStart?: number;
  rowEnd?: number;
  score: number;
};

export async function searchRelevantCsvContext(
  query: string,
): Promise<DocumentContext[]> {
  const [embedding] = await createEmbeddings([query]);

  if (!embedding) return [];

  const qdrantSignal = AbortSignal.timeout(QDRANT_TIMEOUT_MS);
  const response = await fetch(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: qdrantSignal,
      body: JSON.stringify({
        query: embedding,
        limit: QDRANT_SEARCH_LIMIT,
        score_threshold: QDRANT_SCORE_THRESHOLD,
        with_payload: true,
        with_vector: false,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Qdrant search error: ${await response.text()}`);
  }

  const data = (await response.json()) as QdrantQueryResponse;

  return (data.result?.points ?? []).flatMap((point) => {
    const text = point.payload?.text;
    const source = point.payload?.source;

    if (typeof text !== "string" || typeof source !== "string") return [];

    return [
      {
        text,
        source,
        rowStart:
          typeof point.payload?.rowStart === "number"
            ? point.payload.rowStart
            : undefined,
        rowEnd:
          typeof point.payload?.rowEnd === "number"
            ? point.payload.rowEnd
            : undefined,
        score: point.score,
      },
    ];
  });
}

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
