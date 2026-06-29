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
      className="-mx-2 -mb-2 mt-3 flex shrink-0 flex-col gap-2 border-t-2 border-black bg-[#fff333] px-2 py-3 min-[560px]:flex-row min-[560px]:flex-wrap min-[560px]:items-end sm:-mx-4 sm:-mb-4 sm:mt-4 sm:px-4 md:-mx-5 md:-mb-5 md:px-5"
    >
      <textarea
        value={props.message}
        onChange={(event) => props.setMessage(event.target.value)}
        onKeyDown={handleMessageKeyDown}
        aria-label="Scrivi un messaggio"
        placeholder="Scrivi un messaggio..."
        rows={2}
        className="min-h-12 min-w-0 flex-1 resize-y rounded-lg border-2 border-black bg-[#fff27a] px-3 py-2.5 leading-6 text-black outline-none transition placeholder:text-black/50 focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20"
      />
      <button
        type="submit"
        disabled={!canSendMessage}
        className="min-h-12 shrink-0 rounded-lg border-2 border-black bg-black px-5 py-2.5 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
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
