import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "#/services/network";

const SELECTED_MODEL_STORAGE_KEY = "qzr-ai-selected-model";

export default function useOllamaModels() {
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === "undefined") return "";

    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) ?? "";
  });

  const modelsQuery = useQuery({
    queryKey: ["ollama-models"],
    queryFn: getModels,
    staleTime: 30_000,
  });

  const models = modelsQuery.data ?? [];
  const selectedModelExists = models.some((model) => model.name === selectedModel);

  useEffect(() => {
    if (!modelsQuery.isSuccess) return;

    if (models.length === 0) {
      setSelectedModel("");
      localStorage.removeItem(SELECTED_MODEL_STORAGE_KEY);
      return;
    }

    if (!selectedModelExists) {
      setSelectedModel(models[0].name);
    }
  }, [models, modelsQuery.isSuccess, selectedModelExists]);

  useEffect(() => {
    if (!selectedModel) return;

    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  return {
    models,
    selectedModel,
    setSelectedModel,
    modelsError: modelsQuery.error?.message ?? null,
    isModelsLoading: modelsQuery.isPending,
    hasNoModels: modelsQuery.isSuccess && models.length === 0,
  };
}
