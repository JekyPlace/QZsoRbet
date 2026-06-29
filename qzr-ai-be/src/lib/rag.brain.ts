import type { DocumentContext } from "../types/api.types.js";
import type { UserIntent } from "./prompt.brain.js";

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

type LogRagDecisionParams = {
  documentContext: DocumentContext[];
  isMissingDocumentContext: boolean;
  retrievalQuery: string;
  userIntent: UserIntent;
};

export function logRagDecision({
  documentContext,
  isMissingDocumentContext,
  retrievalQuery,
  userIntent,
}: LogRagDecisionParams) {
  if (process.env.NODE_ENV === "production") return;

  const topDocument = documentContext[0];

  console.info("RAG decision", {
    isMissingDocumentContext,
    minScore: MIN_DOCUMENT_RELEVANCE_SCORE,
    results: documentContext.length,
    retrievalQuery,
    topScore: topDocument?.score,
    topSource: topDocument?.source,
    userIntent,
  });
}
