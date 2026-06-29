import type { FormEvent, KeyboardEvent } from "react";

export type ChatPromptBuilderProps = {
  hasNoModels: boolean;
  isSending: boolean;
  message: string;
  sendError: string | null;
  sendMessage: () => void;
  setMessage: (message: string) => void;
};

export function useChatPromptBuilder({
  hasNoModels,
  isSending,
  message,
  sendMessage,
}: ChatPromptBuilderProps) {
  const canSendMessage = !isSending && message.trim().length > 0 && !hasNoModels;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasNoModels) return;

    sendMessage();
  }

  function handleMessageKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    if (canSendMessage) sendMessage();
  }

  return {
    canSendMessage,
    handleMessageKeyDown,
    handleSubmit,
  };
}
