import type { DocumentContext } from "../types/api.types.js";

const MIN_DOCUMENT_RELEVANCE_SCORE = Number(
  process.env.MIN_DOCUMENT_RELEVANCE_SCORE ?? 0.45,
);

export function buildRetrievalQuery(
  recentUserContext: string[],
  userContent: string,
) {
  return [...recentUserContext, userContent].join("\n");
}

export function hasRelevantDocumentContext(
  documentContext: DocumentContext[],
) {
  return documentContext.some(
    (document) => document.score >= MIN_DOCUMENT_RELEVANCE_SCORE,
  );
}
