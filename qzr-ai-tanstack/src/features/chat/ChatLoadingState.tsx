import {
  useChatLoadingState,
  type ChatLoadingStateProps,
} from "./chatLoadingState.brain";

export default function ChatLoadingState(props: ChatLoadingStateProps) {
  const { label, message } = useChatLoadingState(props);

  return (
    <div className="grid flex-1 place-items-center" aria-live="polite" aria-label={label}>
      <div className="flex items-center gap-3 rounded-lg border-2 border-black bg-[#fff27a] px-4 py-3 font-bold">
        <span className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
        {message}
      </div>
    </div>
  );
}
