import type { AIMessage, DocumentContext } from "../types/api.types.js";
import type { UserIntent } from "./prompt.brain.js";

const DEBUG_RAG = process.env.DEBUG_RAG === "true";
const DEBUG_RAG_PROMPT = process.env.DEBUG_RAG_PROMPT === "true";
const DEBUG_RAG_TEXT_CHARS = Number(
  process.env.DEBUG_RAG_TEXT_CHARS ?? 300,
);
const DEBUG_RAG_PROMPT_CHARS = Number(
  process.env.DEBUG_RAG_PROMPT_CHARS ?? 2000,
);
const MIN_TOP_DOCUMENT_SCORE = Number(
  process.env.MIN_TOP_DOCUMENT_SCORE ?? 0.42,
);
const MIN_DOCUMENT_SCORE = Number(
  process.env.MIN_DOCUMENT_SCORE ?? 0.25,
);
const MIN_RELATIVE_SCORE_RATIO = Number(
  process.env.MIN_RELATIVE_SCORE_RATIO ?? 0.82,
);
const MAX_CONTEXT_DOCUMENTS = Number(
  process.env.MAX_CONTEXT_DOCUMENTS ?? 8,
);

export function selectRelevantDocumentContext(
  documentContext: DocumentContext[],
) {
  const sortedDocuments = [...documentContext].sort(
    (documentA, documentB) => documentB.score - documentA.score,
  );
  const topDocument = sortedDocuments[0];

  if (!topDocument || topDocument.score < MIN_TOP_DOCUMENT_SCORE) {
    return [];
  }

  const relativeThreshold = Math.max(
    MIN_DOCUMENT_SCORE,
    topDocument.score * MIN_RELATIVE_SCORE_RATIO,
  );

  return sortedDocuments
    .filter((document) => document.score >= relativeThreshold)
    .slice(0, MAX_CONTEXT_DOCUMENTS);
}

type LogRagDecisionParams = {
  documentContext: DocumentContext[];
  isMissingDocumentContext: boolean;
  retrievedDocumentContext: DocumentContext[];
  retrievalQuery: string;
  userIntent: UserIntent;
};

function previewText(text: string, maxLength: number) {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  return normalizedText.length > maxLength
    ? `${normalizedText.slice(0, maxLength)}...[truncated]`
    : normalizedText;
}

export function logRagDecision({
  documentContext,
  isMissingDocumentContext,
  retrievedDocumentContext,
  retrievalQuery,
  userIntent,
}: LogRagDecisionParams) {
  if (process.env.NODE_ENV === "production") return;

  const topDocument = retrievedDocumentContext[0];
  const effectiveThreshold = topDocument
    ? Math.max(
        MIN_DOCUMENT_SCORE,
        topDocument.score * MIN_RELATIVE_SCORE_RATIO,
      )
    : null;

  console.info("RAG decision", {
    candidates: retrievedDocumentContext.length,
    effectiveThreshold:
      effectiveThreshold === null
        ? null
        : Number(effectiveThreshold.toFixed(6)),
    isMissingDocumentContext,
    maxContextDocuments: MAX_CONTEXT_DOCUMENTS,
    minDocumentScore: MIN_DOCUMENT_SCORE,
    minTopScore: MIN_TOP_DOCUMENT_SCORE,
    relativeScoreRatio: MIN_RELATIVE_SCORE_RATIO,
    retrievalQuery,
    selected: documentContext.length,
    topScore: topDocument?.score,
    topSource: topDocument?.source,
    userIntent,
  });

  if (!DEBUG_RAG) return;

  console.info(
    "RAG candidates",
    retrievedDocumentContext.map((document, index) => ({
      chunkIndex: document.chunkIndex,
      fileName: document.fileName,
      page: document.page,
      pointId: document.pointId,
      preview: previewText(document.text, DEBUG_RAG_TEXT_CHARS),
      rank: index + 1,
      rows:
        document.rowStart === undefined
          ? undefined
          : `${document.rowStart}-${document.rowEnd ?? document.rowStart}`,
      score: Number(document.score.toFixed(6)),
      selected: documentContext.includes(document),
      selectionReason: documentContext.includes(document)
        ? "selected"
        : topDocument && topDocument.score < MIN_TOP_DOCUMENT_SCORE
          ? "top_below_minimum"
          : effectiveThreshold !== null &&
              document.score < effectiveThreshold
            ? "below_effective_threshold"
            : "context_limit",
      source: document.source,
      type: document.type,
    })),
  );
}

export function logRagPrompt(messages: AIMessage[]) {
  if (
    process.env.NODE_ENV === "production" ||
    !DEBUG_RAG_PROMPT
  ) {
    return;
  }

  console.info(
    "RAG prompt",
    messages.map((message, index) => ({
      chars: message.content.length,
      content: previewText(message.content, DEBUG_RAG_PROMPT_CHARS),
      index,
      role: message.role,
    })),
  );
}
