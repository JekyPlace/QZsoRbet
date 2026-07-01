import { SendHorizontal } from "lucide-react";
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
      className="-mx-2 -mb-2 mt-2 flex shrink-0 flex-col gap-2 bg-[#fff333] px-2 py-2.5 min-[560px]:flex-row min-[560px]:flex-wrap min-[560px]:items-end sm:-mx-4 sm:-mb-4 sm:mt-3 sm:px-4 md:-mx-5 md:-mb-5 md:px-5"
    >
      <textarea
        autoFocus
        value={props.message}
        onChange={(event) => props.setMessage(event.target.value)}
        onKeyDown={handleMessageKeyDown}
        aria-label="Scrivi un messaggio"
        placeholder="Scrivi un messaggio..."
        rows={1}
        className="min-h-11 max-h-36 min-w-0 flex-1 resize-y rounded-full border-2 border-black bg-[#fff27a] px-4 py-2 leading-6 text-black outline-none transition placeholder:text-black/50 focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20"
      />
      <button
        type="submit"
        aria-label="Invia messaggio"
        disabled={!canSendMessage}
        className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-black bg-black text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed ${
          props.message.trim()
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <SendHorizontal size={18} />
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
