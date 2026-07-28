import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQueryRewriteMessages,
  parseQueryRewrite,
  tryParseQueryRewrite,
} from "./queryRewrite.brain.js";

test("parses a valid standalone query", () => {
  const result = parseQueryRewrite(
    JSON.stringify({
      intent: "topic_shift",
      query: "Quando è stata fondata QZR?",
      usesConversationContext: false,
    }),
    "Quando è nata QZR?",
  );

  assert.deepEqual(result, {
    intent: "topic_shift",
    query: "Quando è stata fondata QZR?",
    usesConversationContext: false,
  });
});

test("accepts JSON wrapped in a markdown code fence", () => {
  const result = tryParseQueryRewrite(`
\`\`\`json
{
  "query": "Chi lavora nel reparto design di QZR?",
  "usesConversationContext": true,
  "intent": "follow_up"
}
\`\`\`
`);

  assert.deepEqual(result, {
    intent: "follow_up",
    query: "Chi lavora nel reparto design di QZR?",
    usesConversationContext: true,
  });
});

test("falls back to the original query for invalid output", () => {
  const result = parseQueryRewrite(
    '{"query":"Una risposta, non una query","intent":"invalid"}',
    "Dove si trova QZR?",
  );

  assert.deepEqual(result, {
    intent: "standalone",
    query: "Dove si trova QZR?",
    usesConversationContext: false,
  });
});

test("builds a structured rewriting request with recent conversation", () => {
  const messages = buildQueryRewriteMessages({
    conversationMemory: {
      activeTopic: "Team di QZR",
      entities: ["QZR"],
      summary: "L'utente sta confrontando i reparti di QZR.",
      unresolvedReferences: [],
      userConstraints: [],
      version: 1,
    },
    currentRequest: "E per il design?",
    recentMessages: [
      {
        content: "Chi lavora nello sviluppo di QZR?",
        role: "user",
      },
      {
        content: "Nel team di sviluppo lavorano...",
        role: "assistant",
      },
    ],
  });

  assert.equal(messages[0]?.role, "system");
  assert.equal(messages[1]?.role, "user");

  const input = JSON.parse(messages[1]?.content ?? "{}") as {
    conversationMemory?: { activeTopic?: string };
    currentRequest?: string;
    recentMessages?: unknown[];
  };

  assert.equal(input.conversationMemory?.activeTopic, "Team di QZR");
  assert.equal(input.currentRequest, "E per il design?");
  assert.equal(input.recentMessages?.length, 2);
});
