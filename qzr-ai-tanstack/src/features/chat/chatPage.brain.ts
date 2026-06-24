import type { Chat, OllamaModel } from "#/types/api.types";

export type ChatPageProps = {
  chat: Chat | null;
  chatError: string | null;
  hasNoModels: boolean;
  isChatFetching: boolean;
  isChatLoading: boolean;
  isModelsLoading: boolean;
  isSending: boolean;
  message: string;
  models: OllamaModel[];
  modelsError: string | null;
  pendingMessage: string;
  refetchChat: () => void;
  selectedModel: string;
  sendError: string | null;
  sendMessage: () => void;
  setMessage: (message: string) => void;
  setSelectedModel: (model: string) => void;
  streamingMessage: string;
};

export function useChatPage({
  chat,
  chatError,
  isChatLoading,
}: ChatPageProps) {
  return {
    shouldShowError: Boolean(chatError && !chat && !isChatLoading),
    shouldShowPromptBuilder: Boolean(!isChatLoading && chat),
  };
}
