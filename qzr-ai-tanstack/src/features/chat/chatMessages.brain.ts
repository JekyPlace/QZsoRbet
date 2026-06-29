import { useEffect, useRef } from "react";
import type { Chat } from "#/types/api.types";

const BOTTOM_OFFSET = 96;

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const previousChatIdRef = useRef(chat.id);

  useEffect(() => {
    const updateIsNearBottom = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollBottom =
        container.scrollHeight - container.clientHeight - container.scrollTop;

      isNearBottomRef.current = scrollBottom <= BOTTOM_OFFSET;
    };

    const container = containerRef.current;
    if (!container) return;

    updateIsNearBottom();
    container.addEventListener("scroll", updateIsNearBottom, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateIsNearBottom);
    };
  }, []);

  useEffect(() => {
    const isNewChat = previousChatIdRef.current !== chat.id;
    previousChatIdRef.current = chat.id;

    if (!isNewChat && !isNearBottomRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      behavior: streamingMessage ? "auto" : "smooth",
      top: container.scrollHeight,
    });
  }, [chat.id, chat.messages.length, pendingMessage, streamingMessage]);

  return {
    containerRef,
    messages: chat.messages,
  };
}
