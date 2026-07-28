import type {
  Chat,
  ChatMessageBody,
  ContextFile,
  ContextUploadResponse,
  OllamaModel,
} from "#/types/api.types";

type StreamEvent =
  | { event: "chunk"; data: { content: string } }
  | { event: "done"; data: { chat: Chat } }
  | { event: "error"; data: { error: string } };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "").trim() ||
  "http://localhost:8555";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseStreamEvent(block: string): StreamEvent | null {
  const lines = block.split("\n");
  const event = lines
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart())
    .join("\n");

  if (!event || !data) return null;

  return {
    event,
    data: JSON.parse(data),
  } as StreamEvent;
}

export async function streamChatMessage(
  body: ChatMessageBody,
  onChunk?: (content: string) => void,
): Promise<Chat> {
  const response = await fetch(apiUrl("/chat/message"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      from: "HUMAN",
    }),
  });

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Il server non ha restituito uno stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completedChat: Chat | null = null;

  while (true) {
    const { value, done } = await reader.read();
    buffer = (buffer + decoder.decode(value, { stream: !done })).replaceAll(
      "\r\n",
      "\n",
    );

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const streamEvent = parseStreamEvent(block);
      if (!streamEvent) continue;

      if (streamEvent.event === "chunk") {
        onChunk?.(streamEvent.data.content);
      }

      if (streamEvent.event === "done") {
        completedChat = streamEvent.data.chat;
      }

      if (streamEvent.event === "error") {
        throw new Error(streamEvent.data.error);
      }
    }

    if (done) break;
  }

  const finalEvent = parseStreamEvent(buffer);

  if (finalEvent?.event === "done") {
    completedChat = finalEvent.data.chat;
  } else if (finalEvent?.event === "error") {
    throw new Error(finalEvent.data.error);
  } else if (finalEvent?.event === "chunk") {
    onChunk?.(finalEvent.data.content);
  }

  if (!completedChat) {
    throw new Error("Lo stream è terminato senza restituire la chat");
  }

  return completedChat;
}

export async function postMessage(body: ChatMessageBody) {
  return streamChatMessage(body);
}

export async function getModels(): Promise<OllamaModel[]> {
  const response = await fetch(apiUrl("/models"));

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
  }

  const models = await response.json();

  if (!Array.isArray(models)) {
    throw new Error("Il server non ha restituito una lista di modelli");
  }

  return models
    .filter(
      (model): model is OllamaModel =>
        typeof model === "object" &&
        model !== null &&
        "name" in model &&
        typeof model.name === "string" &&
        model.name.trim().length > 0,
    )
    .map((model) => ({ name: model.name }));
}

export async function getChats() {
  const response = await fetch(apiUrl("/chats"));

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getContextFiles(): Promise<ContextFile[]> {
  const filesUrl = apiUrl("/context/files");
  const response = await fetch(filesUrl);

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
  }

  const files = await response.json();

  if (!Array.isArray(files)) {
    throw new Error(`Risposta non valida da ${filesUrl}`);
  }

  return files as ContextFile[];
}

export async function uploadContextFile(
  file: File,
): Promise<ContextUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const uploadUrl = apiUrl("/context/upload");

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : `Errore HTTP ${response.status}: ${response.statusText} (${uploadUrl})`,
    );
  }

  if (!data) {
    throw new Error(
      `Risposta non valida da ${uploadUrl}. Controlla che VITE_API_BASE_URL punti al backend.`,
    );
  }

  return data as ContextUploadResponse;
}

export async function deleteContextFile(storedName: string): Promise<void> {
  if (!storedName.trim()) {
    throw new Error("Documento inesistente");
  }

  const deleteUrl = apiUrl(`/context/files/${encodeURIComponent(storedName)}`);
  const response = await fetch(deleteUrl, { method: "DELETE" });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage: string | null = null;

    try {
      const data = JSON.parse(responseText) as { error?: unknown };
      errorMessage = typeof data.error === "string" ? data.error : null;
    } catch {
      // The backend may return a non-JSON error response.
    }

    throw new Error(
      errorMessage ??
        `Errore HTTP ${response.status}: ${response.statusText} (${deleteUrl})`,
    );
  }
}
