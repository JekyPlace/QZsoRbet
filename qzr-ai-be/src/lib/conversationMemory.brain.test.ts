import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConversationMemorySystemMessage,
  parseStoredConversationMemory,
  partitionConversationMessages,
  tryParseConversationMemory,
} from "./conversationMemory.brain.js";

const messages = Array.from({ length: 10 }, (_, index) => ({
  content: `Messaggio ${index + 1}`,
  role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
}));

test("progressively summarizes only messages leaving the recent window", () => {
  const firstPartition = partitionConversationMessages({
    memoryMessageCount: 0,
    messages,
    recentMessagesToKeep: 4,
  });

  assert.deepEqual(
    firstPartition.messagesToSummarize.map((message) => message.content),
    messages.slice(0, 6).map((message) => message.content),
  );
  assert.deepEqual(firstPartition.recentMessages, messages.slice(6));
  assert.equal(firstPartition.targetMemoryMessageCount, 6);

  const nextMessages = [
    ...messages,
    { content: "Messaggio 11", role: "user" as const },
    { content: "Messaggio 12", role: "assistant" as const },
  ];
  const secondPartition = partitionConversationMessages({
    memoryMessageCount: firstPartition.targetMemoryMessageCount,
    messages: nextMessages,
    recentMessagesToKeep: 4,
  });

  assert.deepEqual(
    secondPartition.messagesToSummarize.map((message) => message.content),
    ["Messaggio 7", "Messaggio 8"],
  );
  assert.deepEqual(secondPartition.recentMessages, nextMessages.slice(8));
  assert.equal(secondPartition.targetMemoryMessageCount, 8);
});

test("parses and normalizes valid structured memory", () => {
  const memory = tryParseConversationMemory(`
\`\`\`json
{
  "version": 1,
  "summary": " L'utente sta confrontando i reparti di QZR. ",
  "activeTopic": " Team QZR ",
  "entities": ["QZR", "QZR", "design"],
  "userConstraints": ["solo dipendenti"],
  "unresolvedReferences": []
}
\`\`\`
`);

  assert.deepEqual(memory, {
    activeTopic: "Team QZR",
    entities: ["QZR", "design"],
    summary: "L'utente sta confrontando i reparti di QZR.",
    unresolvedReferences: [],
    userConstraints: ["solo dipendenti"],
    version: 1,
  });
});

test("rejects malformed model output", () => {
  assert.equal(
    tryParseConversationMemory(
      '{"version":2,"summary":"x","activeTopic":null,"entities":[]}',
    ),
    null,
  );
});

test("falls back safely when stored JSON has an old or partial shape", () => {
  const memory = parseStoredConversationMemory({
    entities: ["QZR"],
    summary: "Argomento precedente",
  });

  assert.deepEqual(memory, {
    activeTopic: null,
    entities: ["QZR"],
    summary: "Argomento precedente",
    unresolvedReferences: [],
    userConstraints: [],
    version: 1,
  });
});

test("marks memory as non-authoritative in the final prompt", () => {
  const [message] = buildConversationMemorySystemMessage({
    activeTopic: "Sede di QZR",
    entities: ["QZR"],
    summary: "L'utente ha chiesto informazioni sulla sede.",
    unresolvedReferences: [],
    userConstraints: [],
    version: 1,
  });

  assert.equal(message?.role, "system");
  assert.match(message?.content ?? "", /Non trattarla come fonte fattuale/);
  assert.match(message?.content ?? "", /document_context/);
});
