import {
  useChatPromptBuilder,
  type ChatPromptBuilderProps,
} from "./chatPromptBuilder.brain";

export default function ChatPromptBuilder(props: ChatPromptBuilderProps) {
  const { canSendMessage, handleMessageKeyDown, handleSubmit } =
    useChatPromptBuilder(props);

  return (
    <form
      onSubmit={handleSubmit}
      className="-mx-3 -mb-3 mt-4 flex shrink-0 flex-col gap-2 border-t-2 border-black bg-[#fff333] px-3 py-4 min-[560px]:flex-row min-[560px]:flex-wrap min-[560px]:items-end sm:-mx-5 sm:-mb-5 sm:mt-5 sm:px-5 sm:py-5 md:-mx-7 md:-mb-7 md:px-7"
    >
      <textarea
        value={props.message}
        onChange={(event) => props.setMessage(event.target.value)}
        onKeyDown={handleMessageKeyDown}
        aria-label="Scrivi un messaggio"
        placeholder="Scrivi un messaggio..."
        rows={2}
        className="min-h-14 min-w-0 flex-1 resize-y rounded-xl border-2 border-black bg-[#fff27a] px-4 py-3 leading-6 text-black outline-none transition placeholder:text-black/50 focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20"
      />
      <label className="flex min-w-44 flex-col gap-1 text-xs font-bold min-[560px]:max-w-56">
        Modello
        <select
          value={props.selectedModel}
          onChange={(event) => props.setSelectedModel(event.target.value)}
          disabled={
            props.isSending || props.isModelsLoading || props.models.length === 0
          }
          className="min-h-14 rounded-xl border-2 border-black bg-[#fff27a] px-3 py-2 text-sm text-black outline-none transition focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.models.length > 0 ? (
            props.models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))
          ) : (
            <option value="">
              {props.isModelsLoading ? "Caricamento..." : "Default backend"}
            </option>
          )}
        </select>
      </label>
      <button
        type="submit"
        disabled={!canSendMessage}
        className="min-h-14 shrink-0 rounded-xl border-2 border-black bg-black px-6 py-3 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Invia
      </button>

      {props.hasNoModels && (
        <p
          className="m-0 text-sm font-medium text-black min-[440px]:basis-full"
          role="alert"
        >
          Nessun modello Ollama disponibile.
        </p>
      )}
      {props.modelsError && !props.hasNoModels && (
        <p
          className="m-0 text-sm font-medium text-black min-[440px]:basis-full"
          role="alert"
        >
          Modelli non disponibili: uso il default del backend.
        </p>
      )}
      {props.sendError && (
        <p
          className="m-0 text-sm font-medium text-black min-[440px]:basis-full"
          role="alert"
        >
          {props.sendError}
        </p>
      )}
    </form>
  );
}
