import type { DocumentContext } from "../types/api.types.js";

export function shouldRetryRetrievalWithHint({
  context,
  hint,
  minTopScore,
}: {
  context: DocumentContext[];
  hint: string;
  minTopScore: number;
}) {
  if (!hint.trim()) return false;

  return (context[0]?.score ?? Number.NEGATIVE_INFINITY) < minTopScore;
}

export function selectBestRetrievalContext(
  initialContext: DocumentContext[],
  hintedContext: DocumentContext[],
) {
  const initialTopScore =
    initialContext[0]?.score ?? Number.NEGATIVE_INFINITY;
  const hintedTopScore =
    hintedContext[0]?.score ?? Number.NEGATIVE_INFINITY;

  return hintedTopScore > initialTopScore ? hintedContext : initialContext;
}
