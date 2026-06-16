const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL ?? "embeddinggemma";
const OLLAMA_EMBED_TIMEOUT_MS = Number(
  process.env.OLLAMA_EMBED_TIMEOUT_MS ?? 20_000,
);

type OllamaEmbedResponse = {
  embeddings: number[][];
};

export async function createEmbeddings(
  texts: string[],
  signal?: AbortSignal,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const requestSignal = signal ?? AbortSignal.timeout(OLLAMA_EMBED_TIMEOUT_MS);
  const response = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: requestSignal,
    body: JSON.stringify({
      model: OLLAMA_EMBED_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding error: ${await response.text()}`);
  }

  const data = (await response.json()) as OllamaEmbedResponse;

  if (data.embeddings.length !== texts.length) {
    throw new Error("Ollama returned an invalid number of embeddings");
  }

  return data.embeddings;
}
