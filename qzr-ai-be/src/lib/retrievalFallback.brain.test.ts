import assert from "node:assert/strict";
import test from "node:test";
import type { DocumentContext } from "../types/api.types.js";
import {
  selectBestRetrievalContext,
  shouldRetryRetrievalWithHint,
} from "./retrievalFallback.brain.js";

function context(score: number, source: string): DocumentContext {
  return {
    score,
    source,
    text: source,
  };
}

test("retries when Qdrant returns no candidates", () => {
  assert.equal(
    shouldRetryRetrievalWithHint({
      context: [],
      hint: "QZR",
      minTopScore: 0.42,
    }),
    true,
  );
});

test("retries when the best candidate is below the confidence threshold", () => {
  assert.equal(
    shouldRetryRetrievalWithHint({
      context: [context(0.375, "irrelevant.pdf")],
      hint: "QZR",
      minTopScore: 0.42,
    }),
    true,
  );
});

test("does not retry a retrieval that is already confident", () => {
  assert.equal(
    shouldRetryRetrievalWithHint({
      context: [context(0.58, "qzr_dataset.csv")],
      hint: "QZR",
      minTopScore: 0.42,
    }),
    false,
  );
});

test("does not retry when the domain hint is disabled", () => {
  assert.equal(
    shouldRetryRetrievalWithHint({
      context: [],
      hint: "  ",
      minTopScore: 0.42,
    }),
    false,
  );
});

test("keeps whichever retrieval has the stronger top candidate", () => {
  const initial = [context(0.375, "irrelevant.pdf")];
  const hinted = [context(0.576, "qzr_dataset.csv")];

  assert.equal(selectBestRetrievalContext(initial, hinted), hinted);
  assert.equal(selectBestRetrievalContext(hinted, initial), hinted);
});
