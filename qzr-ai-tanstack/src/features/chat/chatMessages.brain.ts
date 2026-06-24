import { useEffect, useRef } from "react";
import type { Chat } from "#/types/api.types";

export type ChatMessagesProps = {
  chat: Chat;
  isSending: boolean;
  pendingMessage: string;
  streamingMessage: string;
};

export function useChatMessages({
  chat,
  pendingMessage,
  streamingMessage,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, pendingMessage, streamingMessage]);

  return {
    bottomRef,
    messages: chat.messages,
  };
}
