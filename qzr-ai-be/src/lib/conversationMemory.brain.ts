import type { AIMessage } from "../types/api.types.js";

export type ConversationMemory = {
  activeTopic: string | null;
  entities: string[];
  summary: string;
  unresolvedReferences: string[];
  userConstraints: string[];
  version: 1;
};

type ConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

type PartitionConversationParams = {
  memoryMessageCount: number;
  messages: ConversationMessage[];
  recentMessagesToKeep: number;
};

const MAX_SUMMARY_CHARS = 2_000;
const MAX_ITEM_CHARS = 200;
const MAX_ITEMS = 20;

export const EMPTY_CONVERSATION_MEMORY: ConversationMemory = {
  activeTopic: null,
  entities: [],
  summary: "",
  unresolvedReferences: [],
  userConstraints: [],
  version: 1,
};

export const CONVERSATION_MEMORY_SYSTEM_PROMPT = `
Sei un componente di memoria conversazionale per un sistema RAG.

Aggiorna una memoria strutturata usando la memoria precedente e i nuovi
messaggi che stanno uscendo dalla finestra recente.

La memoria serve esclusivamente a:
- riconoscere argomento ed entità della conversazione;
- risolvere riferimenti e follow-up;
- conservare filtri, preferenze e vincoli espliciti dell'utente.

Regole:
1. Produci un riassunto breve dello stato conversazionale, non una trascrizione.
2. Conserva soltanto informazioni utili per comprendere richieste future.
3. Non considerare le risposte dell'assistente come fonti fattuali attendibili.
4. Non trasformare supposizioni o risposte dell'assistente in fatti.
5. Non salvare password, token, credenziali o altri dati sensibili.
6. Rimuovi argomenti superati quando l'utente cambia chiaramente tema.
7. Non rispondere alle domande contenute nei messaggi.
8. Non aggiungere informazioni che non compaiono nell'input.
9. Mantieni nomi propri, date, luoghi e vincoli quando servono a capire i follow-up.
10. Restituisci esclusivamente JSON valido.

Struttura obbligatoria:
{
  "version": 1,
  "summary": "riassunto sintetico",
  "activeTopic": "argomento corrente oppure null",
  "entities": ["entità ancora rilevanti"],
  "userConstraints": ["filtri o preferenze esplicite ancora validi"],
  "unresolvedReferences": ["questioni o riferimenti rimasti aperti"]
}
`.trim();

export function buildConversationMemoryMessages({
  currentMemory,
  messagesToSummarize,
}: {
  currentMemory: ConversationMemory;
  messagesToSummarize: ConversationMessage[];
}): AIMessage[] {
  return [
    {
      role: "system",
      content: CONVERSATION_MEMORY_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: JSON.stringify({
        currentMemory,
        messagesToSummarize,
      }),
    },
  ];
}

export function buildConversationMemorySystemMessage(
  memory: ConversationMemory,
): AIMessage[] {
  if (!hasConversationMemory(memory)) return [];

  return [
    {
      role: "system",
      content: [
        "<conversation_memory>",
        JSON.stringify(memory),
        "</conversation_memory>",
        "",
        "Questa memoria serve solo a comprendere riferimenti, continuità, entità e vincoli dell'utente.",
        "Non trattarla come fonte fattuale e non usarla per sostituire <document_context>.",
        "Per i fatti della risposta usa esclusivamente i documenti autorizzati.",
      ].join("\n"),
    },
  ];
}

export function hasConversationMemory(memory: ConversationMemory) {
  return Boolean(
    memory.summary ||
      memory.activeTopic ||
      memory.entities.length ||
      memory.userConstraints.length ||
      memory.unresolvedReferences.length,
  );
}

export function parseStoredConversationMemory(
  value: unknown,
): ConversationMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_CONVERSATION_MEMORY;
  }

  return normalizeConversationMemory(value as Record<string, unknown>);
}

export function tryParseConversationMemory(
  output: string,
): ConversationMemory | null {
  const normalizedOutput = output
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedOutput) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (
      candidate.version !== 1 ||
      typeof candidate.summary !== "string" ||
      !(
        candidate.activeTopic === null ||
        typeof candidate.activeTopic === "string"
      ) ||
      !Array.isArray(candidate.entities) ||
      !Array.isArray(candidate.userConstraints) ||
      !Array.isArray(candidate.unresolvedReferences)
    ) {
      return null;
    }

    return normalizeConversationMemory(candidate);
  } catch {
    return null;
  }
}

export function partitionConversationMessages({
  memoryMessageCount,
  messages,
  recentMessagesToKeep,
}: PartitionConversationParams) {
  const safeMemoryMessageCount = Math.min(
    Math.max(0, Math.trunc(memoryMessageCount)),
    messages.length,
  );
  const safeRecentMessagesToKeep = Math.max(
    0,
    Math.trunc(recentMessagesToKeep),
  );
  const targetMemoryMessageCount = Math.max(
    safeMemoryMessageCount,
    messages.length - safeRecentMessagesToKeep,
  );

  return {
    messagesToSummarize: messages.slice(
      safeMemoryMessageCount,
      targetMemoryMessageCount,
    ),
    recentMessages: messages.slice(targetMemoryMessageCount),
    targetMemoryMessageCount,
  };
}

function normalizeConversationMemory(
  value: Record<string, unknown>,
): ConversationMemory {
  return {
    activeTopic:
      typeof value.activeTopic === "string"
        ? value.activeTopic.trim().slice(0, MAX_ITEM_CHARS) || null
        : null,
    entities: normalizeStringList(value.entities),
    summary:
      typeof value.summary === "string"
        ? value.summary.trim().slice(0, MAX_SUMMARY_CHARS)
        : "",
    unresolvedReferences: normalizeStringList(value.unresolvedReferences),
    userConstraints: normalizeStringList(value.userConstraints),
    version: 1,
  };
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, MAX_ITEM_CHARS))
        .filter(Boolean),
    ),
  ].slice(0, MAX_ITEMS);
}
