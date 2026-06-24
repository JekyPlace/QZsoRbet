import {
  useChatErrorState,
  type ChatErrorStateProps,
} from "./chatErrorState.brain";

export default function ChatErrorState(props: ChatErrorStateProps) {
  const { retryLabel, title } = useChatErrorState(props);

  return (
    <div className="grid flex-1 place-items-center">
      <div
        className="w-full max-w-md rounded-xl border-2 border-black bg-[#fff27a] p-4 text-center"
        role="alert"
      >
        <h3 className="m-0 text-lg font-black">{title}</h3>
        <p className="my-2 text-sm">{props.error}</p>
        <button
          type="button"
          disabled={props.isRetrying}
          className="rounded-lg border-2 border-black bg-black px-4 py-2 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={props.onRetry}
        >
          {retryLabel}
        </button>
      </div>
    </div>
  );
}
