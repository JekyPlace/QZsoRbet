import type { Message } from "#/types/api.types";
import { useState } from "react";

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
  const [copyLabel, setCopyLabel] = useState("Copia");
  const isHuman = message.from === "HUMAN";

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyLabel("Copiato");
      window.setTimeout(() => setCopyLabel("Copia"), 1600);
    } catch {
      setCopyLabel("Errore");
      window.setTimeout(() => setCopyLabel("Copia"), 1600);
    }
  }

  return {
    isHuman,
    copyLabel,
    copyMessage,
    messageTime: formatMessageTime(message.timestamp),
  };
}
