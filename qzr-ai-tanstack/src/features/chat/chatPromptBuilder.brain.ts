import type { FormEvent, KeyboardEvent } from "react";
import type { OllamaModel } from "#/types/api.types";

export type ChatPromptBuilderProps = {
  hasNoModels: boolean;
  isModelsLoading: boolean;
  isSending: boolean;
  message: string;
  models: OllamaModel[];
  modelsError: string | null;
  selectedModel: string;
  sendError: string | null;
  sendMessage: () => void;
  setMessage: (message: string) => void;
  setSelectedModel: (model: string) => void;
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
