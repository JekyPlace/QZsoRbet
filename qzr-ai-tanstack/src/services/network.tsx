import type { Chat } from "#/hooks/useChat";

type MessageBody = {
  chatId?: string;
  label?: string;
  content: string;
};

type StreamEvent =
  | { event: "chunk"; data: { content: string } }
  | { event: "done"; data: { chat: Chat } }
  | { event: "error"; data: { error: string } };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
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
  body: MessageBody,
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

export async function postMessage(body: MessageBody) {
  return streamChatMessage(body);
}

export async function getChats() {
  const response = await fetch(apiUrl("/chats"));

  if (!response.ok) {
    throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
