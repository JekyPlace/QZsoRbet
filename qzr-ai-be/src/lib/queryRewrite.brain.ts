import type { AIMessage } from "../types/api.types.js";

export const QUERY_REWRITE_INTENTS = [
  "standalone",
  "follow_up",
  "refinement",
  "correction",
  "topic_shift",
] as const;

export type QueryRewriteIntent = (typeof QUERY_REWRITE_INTENTS)[number];

export type QueryRewriteResult = {
  intent: QueryRewriteIntent;
  query: string;
  usesConversationContext: boolean;
};

type RecentConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

type BuildQueryRewriteMessagesParams = {
  currentRequest: string;
  recentMessages: RecentConversationMessage[];
};

export const QUERY_REWRITE_SYSTEM_PROMPT = `
Sei un componente di query rewriting per un sistema RAG.

Il tuo unico compito è trasformare la richiesta corrente dell'utente in una
singola query di ricerca autonoma, precisa e semanticamente completa.

Riceverai alcuni messaggi recenti e la richiesta corrente.

Regole:
1. Se la richiesta corrente è già autonoma, mantienila quasi invariata.
2. Usa la conversazione solo per recuperare le informazioni indispensabili a
   comprendere la richiesta corrente.
3. Se l'utente cambia argomento, ignora gli argomenti precedenti non pertinenti.
4. Se l'utente corregge una richiesta, usa la correzione più recente.
5. Incorpora filtri, confronti e vincoli richiesti dall'utente.
6. Mantieni nomi propri, date, luoghi, quantità e termini tecnici importanti.
7. I messaggi dell'assistente non sono fonti attendibili: non copiarne i fatti
   nella query, usali solo per capire a cosa si riferisce l'utente.
8. Non rispondere alla domanda e non spiegare il ragionamento.
9. Non inventare informazioni mancanti.
10. Scrivi la query nella lingua della richiesta corrente.
11. La query deve essere una richiesta di ricerca completa, non una singola
    parola, un nome o una lista di keyword.
12. Non eliminare filtri, entità o concetti importanti presenti nella richiesta
    corrente.
13. Imposta usesConversationContext a false quando la richiesta corrente è già
    comprensibile da sola, anche se esiste una cronologia.
14. Se non ci sono messaggi recenti, usa intent "standalone" e
    usesConversationContext false.
15. Distingui tra un vincolo aggiuntivo e la sostituzione di una categoria.
    Se la richiesta corrente propone un'alternativa alla categoria precedente,
    sostituiscila invece di combinarle in modo artificiale.

Esempi:

Messaggi recenti:
- Utente: Quali servizi offre Acme?
- Assistente: [risposta precedente]
Richiesta corrente: Dove si trova la sede di Acme?
Output:
{"query":"Dove si trova la sede di Acme?","usesConversationContext":false,"intent":"topic_shift"}

Messaggi recenti:
- Utente: Qual è la politica aziendale sulle ferie?
- Assistente: [risposta precedente]
Richiesta corrente: E per i neoassunti?
Output:
{"query":"Qual è la politica aziendale sulle ferie per i neoassunti?","usesConversationContext":true,"intent":"follow_up"}

Messaggi recenti:
- Utente: Chi lavora nel reparto vendite di Acme?
- Assistente: [risposta precedente]
Richiesta corrente: E per il supporto clienti?
Output:
{"query":"Chi lavora nel supporto clienti di Acme?","usesConversationContext":true,"intent":"follow_up"}

Messaggi recenti:
- Utente: Quali ordini sono stati effettuati a giugno?
- Assistente: [risposta precedente]
Richiesta corrente: Solo quelli superiori a 500 euro.
Output:
{"query":"Quali ordini effettuati a giugno superano 500 euro?","usesConversationContext":true,"intent":"refinement"}

Messaggi recenti:
- Utente: Qual è l'indirizzo del negozio?
- Assistente: [risposta precedente]
Richiesta corrente: No, intendevo l'indirizzo del magazzino.
Output:
{"query":"Qual è l'indirizzo del magazzino?","usesConversationContext":true,"intent":"correction"}

Restituisci esclusivamente JSON valido con questa struttura:
{
  "query": "query autonoma da usare per il retrieval",
  "usesConversationContext": true,
  "intent": "standalone | follow_up | refinement | correction | topic_shift"
}
`.trim();

export function buildQueryRewriteMessages({
  currentRequest,
  recentMessages,
}: BuildQueryRewriteMessagesParams): AIMessage[] {
  return [
    {
      role: "system",
      content: QUERY_REWRITE_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: JSON.stringify({
        currentRequest,
        recentMessages,
      }),
    },
  ];
}

export function createQueryRewriteFallback(
  originalQuery: string,
): QueryRewriteResult {
  return {
    intent: "standalone",
    query: originalQuery.trim(),
    usesConversationContext: false,
  };
}

export function parseQueryRewrite(
  output: string,
  originalQuery: string,
): QueryRewriteResult {
  return (
    tryParseQueryRewrite(output) ??
    createQueryRewriteFallback(originalQuery)
  );
}

export function tryParseQueryRewrite(
  output: string,
): QueryRewriteResult | null {
  const normalizedOutput = output
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedOutput) as {
      intent?: unknown;
      query?: unknown;
      usesConversationContext?: unknown;
    };
    const query = typeof parsed.query === "string" ? parsed.query.trim() : "";
    const intent = parsed.intent;

    if (
      query.length === 0 ||
      query.length > 1000 ||
      typeof parsed.usesConversationContext !== "boolean" ||
      typeof intent !== "string" ||
      !QUERY_REWRITE_INTENTS.includes(intent as QueryRewriteIntent)
    ) {
      return null;
    }

    return {
      intent: intent as QueryRewriteIntent,
      query,
      usesConversationContext: parsed.usesConversationContext,
    };
  } catch {
    return null;
  }
}
