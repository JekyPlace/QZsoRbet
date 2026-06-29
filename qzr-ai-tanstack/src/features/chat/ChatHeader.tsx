import ModelSelect from "#/components/ModelSelect";
import {
  useChatHeader,
  type ChatHeaderProps,
} from "./chatHeader.brain";

export default function ChatHeader(props: ChatHeaderProps) {
  const { title } = useChatHeader(props.label);

  return (
    <header className="mb-3 flex flex-col gap-2 border-b-2 border-black pb-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="mt-0.5 mb-0 truncate text-lg font-black sm:text-xl">
          {title}
        </h1>
        {props.modelsError && !props.hasNoModels && (
          <p className="mt-1 mb-0 text-sm font-medium text-black" role="alert">
            Modelli non disponibili: uso il default del backend.
          </p>
        )}
        {props.hasNoModels && (
          <p className="mt-1 mb-0 text-sm font-medium text-black" role="alert">
            Nessun modello Ollama disponibile.
          </p>
        )}
      </div>

      <label className="flex w-full flex-col gap-1 text-xs font-bold sm:w-52">
        Modello
        <ModelSelect
          disabled={
            props.isSending || props.isModelsLoading || props.models.length === 0
          }
          isLoading={props.isModelsLoading}
          models={props.models}
          selectedModel={props.selectedModel}
          setSelectedModel={props.setSelectedModel}
          size="compact"
        />
      </label>
    </header>
  );
}
