import { createEmbeddings } from "../services/embedding.api.js";
import type { DocumentContext } from "../types/api.types.js";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION ?? "csv_documents";
const QDRANT_SEARCH_LIMIT = Number(process.env.QDRANT_SEARCH_LIMIT ?? 12);
const QDRANT_SCORE_THRESHOLD = Number(
  process.env.QDRANT_SCORE_THRESHOLD ?? 0.2,
);
const QDRANT_TIMEOUT_MS = Number(process.env.QDRANT_TIMEOUT_MS ?? 3000);

type QdrantPayload = {
  chunkIndex?: unknown;
  fileName?: unknown;
  page?: unknown;
  rowStart?: unknown;
  rowEnd?: unknown;
  source?: unknown;
  text?: unknown;
  type?: unknown;
};

type QdrantPoint = {
  id?: unknown;
  score: number;
  payload?: QdrantPayload | null;
};

type QdrantQueryResponse = {
  result?: {
    points?: QdrantPoint[];
  };
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
        chunkIndex:
          typeof point.payload?.chunkIndex === "number"
            ? point.payload.chunkIndex
            : undefined,
        fileName:
          typeof point.payload?.fileName === "string"
            ? point.payload.fileName
            : undefined,
        page:
          typeof point.payload?.page === "number"
            ? point.payload.page
            : undefined,
        pointId:
          typeof point.id === "string" || typeof point.id === "number"
            ? point.id
            : undefined,
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
        type:
          point.payload?.type === "csv" || point.payload?.type === "pdf"
            ? point.payload.type
            : undefined,
      },
    ];
  });
}
