import type { Message } from "#/types/api.types";

export type ChatMessageBubbleProps = {
  message: Message;
};

function formatMessageTime(timestamp?: string) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function useChatMessageBubble(message: Message) {
  const isHuman = message.from === "HUMAN";

  return {
    isHuman,
    authorLabel: isHuman ? "Tu" : "AI",
    messageTime: formatMessageTime(message.timestamp),
  };
}
