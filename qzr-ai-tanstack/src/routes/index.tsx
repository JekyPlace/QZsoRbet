import { createFileRoute } from "@tanstack/react-router";
import Sidebar from "../features/Sidebar";
import { useState } from "react";
import { handleSubmit } from "../services/form";
import { useNavigate } from "@tanstack/react-router";
import ModelSelect from "#/components/ModelSelect";
import useOllamaModels from "#/hooks/useOllamaModels";
import { SendHorizontal } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const suggestedPrompts = [
  "Riassumi i punti principali dei documenti caricati",
  "Trova informazioni su un cliente o progetto",
  "Spiegami questo dato in modo semplice",
  "Genera una risposta pronta da inviare",
  "Chiedi informazioni su QZR",
];

function Home() {
  const [message, setMessage] = useState("");
  const [suggestedPromptIndex] = useState(() =>
    Math.floor(Math.random() * suggestedPrompts.length),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();
  const suggestedPrompt = suggestedPrompts[suggestedPromptIndex];
  const {
    models,
    selectedModel,
    setSelectedModel,
    modelsError,
    isModelsLoading,
    hasNoModels,
  } = useOllamaModels();

  const createChat = async () => {
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
  };

  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-72 md:has-[.sidebar-collapsed]:pl-18">
      <Sidebar expanded={true} />
      <main className="grid min-h-screen place-items-center px-3 py-6 sm:px-6 md:p-8">
        {isCreating ? (
          <div
            className="flex w-full max-w-176 flex-col items-center gap-4 rounded-xl bg-[#fff333] p-8 text-center text-black"
            aria-live="polite"
            aria-label="Creazione chat in corso"
          >
            <span className="size-8 animate-spin rounded-full border-3 border-black border-t-transparent" />
            <div>
              <p className="m-0 text-lg font-bold">Creazione della chat...</p>
              <p className="mt-1 mb-0 text-sm opacity-65">
                QZsoRbet sta preparando la risposta.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await createChat();
            }}
            className="flex w-full max-w-140 flex-col gap-1.5 px-1 leading-relaxed text-black sm:px-4 md:px-6"
          >
            <div className="rounded-xl border-2 border-black bg-[#fff27a] p-2 shadow-[3px_3px_0_rgb(0_0_0/0.1)] transition focus-within:bg-[#fff6a3] focus-within:ring-3 focus-within:ring-black/20">
              <div className="flex min-h-12 items-end gap-2">
                <textarea
                  autoFocus
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey) return;

                    event.preventDefault();
                    void createChat();
                  }}
                  rows={1}
                  className="min-h-10 max-h-32 min-w-0 flex-1 resize-y border-0 bg-transparent px-1.5 py-2 leading-6 text-black outline-none placeholder:text-[#4a4200]"
                  placeholder="Fai una domanda"
                />
                <button
                  type="submit"
                  aria-label="Invia messaggio"
                  disabled={!message.trim() || hasNoModels}
                  className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-black bg-black text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMessage(suggestedPrompt)}
              className="mt-2 w-fit max-w-full appearance-none border-0 bg-transparent p-0 text-left text-[0.72rem] leading-4 font-medium text-black/50 underline-offset-2 transition hover:text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/30"
            >
              Prova con: {suggestedPrompt}
            </button>
            <div className="flex justify-end">
              <label
                className="flex w-full max-w-64 flex-col sm:items-end"
                aria-label="Modello"
              >
                <ModelSelect
                  disabled={
                    isCreating || isModelsLoading || models.length === 0
                  }
                  isLoading={isModelsLoading}
                  models={models}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                />
              </label>
            </div>
            {hasNoModels && (
              <p className="m-0 text-sm font-medium text-black" role="alert">
                Nessun modello Ollama disponibile.
              </p>
            )}
            {modelsError && !hasNoModels && (
              <p className="m-0 text-sm font-medium text-black" role="alert">
                Modelli non disponibili: uso il default del backend.
              </p>
            )}
            {createError && (
              <p className="m-0 text-sm font-medium text-black" role="alert">
                {createError}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
