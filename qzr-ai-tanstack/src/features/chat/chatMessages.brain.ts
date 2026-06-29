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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const previousChatIdRef = useRef(chat.id);

  useEffect(() => {
    const updateIsNearBottom = () => {
      const scrollBottom =
        window.document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;

      isNearBottomRef.current = scrollBottom <= BOTTOM_OFFSET;
    };

    updateIsNearBottom();
    window.addEventListener("scroll", updateIsNearBottom, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateIsNearBottom);
    };
  }, []);

  useEffect(() => {
    const isNewChat = previousChatIdRef.current !== chat.id;
    previousChatIdRef.current = chat.id;

    if (!isNewChat && !isNearBottomRef.current) return;

    bottomRef.current?.scrollIntoView({
      behavior: streamingMessage ? "auto" : "smooth",
      block: "end",
    });
  }, [chat.id, chat.messages.length, pendingMessage, streamingMessage]);

  return {
    bottomRef,
    messages: chat.messages,
  };
}
