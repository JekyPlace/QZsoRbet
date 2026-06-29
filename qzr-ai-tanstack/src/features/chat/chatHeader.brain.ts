import { capitalizeFirstLetter } from "#/utils/formatText";
import type { OllamaModel } from "#/types/api.types";

export type ChatHeaderProps = {
  hasNoModels: boolean;
  isModelsLoading: boolean;
  isSending: boolean;
  label: string;
  models: OllamaModel[];
  modelsError: string | null;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
};

export function useChatHeader(label: string) {
  return {
    title: capitalizeFirstLetter(label),
  };
}
