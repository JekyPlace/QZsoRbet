import { SendHorizontal } from "lucide-react";
import ModelSelect from "#/components/ModelSelect";
import type { HomePageState } from "./homePage.brain";

type HomePromptComposerProps = Pick<
  HomePageState,
  | "canSubmit"
  | "createChat"
  | "createError"
  | "hasNoModels"
  | "isCreating"
  | "isModelsLoading"
  | "message"
  | "models"
  | "modelsError"
  | "selectedModel"
  | "setMessage"
  | "setSelectedModel"
  | "suggestedPrompt"
  | "useSuggestedPrompt"
>;

export default function HomePromptComposer(props: HomePromptComposerProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void props.createChat();
      }}
      className="flex w-full max-w-176 flex-col gap-1.5 px-1 leading-relaxed text-black sm:px-4 md:px-6"
    >
      <h1 className="m-0 mb-2 text-center text-xl font-black sm:text-xl">
        Scopri qualcosa
      </h1>
      <div className="rounded-full border-2 border-black bg-[#fff27a] p-1.5 shadow-[3px_3px_0_rgb(0_0_0/0.1)] transition focus-within:bg-[#fff6a3] focus-within:ring-3 focus-within:ring-black/20">
        <div className="flex min-h-11 items-center gap-2">
          <input
            autoFocus
            type="text"
            value={props.message}
            onChange={(event) => props.setMessage(event.target.value)}
            className="min-h-9 min-w-0 flex-1 border-0 bg-transparent px-3 py-1.5 text-base leading-6 font-medium text-black outline-none placeholder:text-xs placeholder:font-medium placeholder:text-[#4a4200]/60 sm:text-lg sm:placeholder:text-sm"
            placeholder="Fai una domanda"
          />
          <button
            type="submit"
            aria-label="Invia messaggio"
            disabled={!props.canSubmit}
            className={`grid size-9 shrink-0 place-items-center rounded-full border-2 border-black bg-black text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed ${
              props.message.trim()
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={props.useSuggestedPrompt}
        className="mt-2 w-fit max-w-full appearance-none border-0 bg-transparent p-0 text-left text-[0.72rem] leading-4 font-medium text-black/50 underline-offset-2 transition hover:text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/30"
      >
        Prova con: {props.suggestedPrompt}
      </button>

      <div className="flex justify-end">
        <label
          className="flex w-full max-w-64 flex-col sm:items-end"
          aria-label="Modello"
        >
          <ModelSelect
            disabled={
              props.isCreating ||
              props.isModelsLoading ||
              props.models.length === 0
            }
            isLoading={props.isModelsLoading}
            models={props.models}
            selectedModel={props.selectedModel}
            setSelectedModel={props.setSelectedModel}
            size="compact"
          />
        </label>
      </div>

      {props.hasNoModels && (
        <p className="m-0 text-sm font-medium text-black" role="alert">
          Nessun modello Ollama disponibile.
        </p>
      )}
      {props.modelsError && !props.hasNoModels && (
        <p className="m-0 text-sm font-medium text-black" role="alert">
          Modelli non disponibili: uso il default del backend.
        </p>
      )}
      {props.createError && (
        <p className="m-0 text-sm font-medium text-black" role="alert">
          {props.createError}
        </p>
      )}
    </form>
  );
}
