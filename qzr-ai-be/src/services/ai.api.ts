export type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_CONTEXT_SIZE = Number(process.env.OLLAMA_CONTEXT_SIZE ?? 16384);
const OLLAMA_MAX_OUTPUT_TOKENS = Number(
  process.env.OLLAMA_MAX_OUTPUT_TOKENS ?? 4096,
);

type OllamaChatResponse = {
  message?: {
    role: "assistant";
    content: string;
  };
  done?: boolean;
  done_reason?: string;
  error?: string;
};

export async function* streamMessageFromAI(
  messages: AIMessage[],
  model: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        num_ctx: OLLAMA_CONTEXT_SIZE,
        num_predict: OLLAMA_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message to AI: ${await response.text()}`);
  }

  if (!response.body) {
    throw new Error("Ollama returned an empty response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const data = parseOllamaChunk(line);
      if (data.message?.content) yield data.message.content;
      assertNotTruncated(data);
    }

    if (done) break;
  }

  const finalChunk = parseOllamaChunk(buffer);
  if (finalChunk.message?.content) yield finalChunk.message.content;
  assertNotTruncated(finalChunk);
}

function parseOllamaChunk(line: string): OllamaChatResponse {
  if (!line.trim()) return {};

  const data = JSON.parse(line) as OllamaChatResponse;

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function assertNotTruncated(data: OllamaChatResponse) {
  if (data.done && data.done_reason === "length") {
    throw new Error(
      `La risposta ha raggiunto il limite di ${OLLAMA_MAX_OUTPUT_TOKENS} token`,
    );
  }
}
