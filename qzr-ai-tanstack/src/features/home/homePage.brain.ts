import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { handleSubmit } from "#/services/form";
import useOllamaModels from "#/hooks/useOllamaModels";

const suggestedPrompts = [
  "Riassumi i punti principali dei documenti caricati",
  "Trova informazioni su un cliente o progetto",
  "Spiegami questo dato in modo semplice",
  "Genera una risposta pronta da inviare",
  "Chiedi informazioni su QZR",
];

export function useHomePage() {
  const [message, setMessage] = useState("");
  const [suggestedPromptIndex] = useState(() =>
    Math.floor(Math.random() * suggestedPrompts.length),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    models,
    selectedModel,
    setSelectedModel,
    modelsError,
    isModelsLoading,
    hasNoModels,
  } = useOllamaModels();

  const suggestedPrompt = suggestedPrompts[suggestedPromptIndex];
  const canSubmit = message.trim().length > 0 && !hasNoModels;

  async function createChat() {
    if (!message.trim() || isCreating || hasNoModels) return;
    setIsCreating(true);
    setCreateError(null);

    try {
      await handleSubmit(message, selectedModel || undefined, navigate);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Non è stato possibile creare la chat.",
      );
      setIsCreating(false);
    }
  }

  function useSuggestedPrompt() {
    setMessage(suggestedPrompt);
  }

  return {
    canSubmit,
    createChat,
    createError,
    hasNoModels,
    isCreating,
    isModelsLoading,
    message,
    models,
    modelsError,
    selectedModel,
    setMessage,
    setSelectedModel,
    suggestedPrompt,
    useSuggestedPrompt,
  };
}

export type HomePageState = ReturnType<typeof useHomePage>;
