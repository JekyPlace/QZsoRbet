import {
  useChatDateSeparator,
  type ChatDateSeparatorProps,
} from "./chatDateSeparator.brain";

export default function ChatDateSeparator(props: ChatDateSeparatorProps) {
  const { dateLabel, shouldShowDateSeparator } =
    useChatDateSeparator(props);

  if (!shouldShowDateSeparator) return null;

  return (
    <div className="flex w-full flex-col items-center gap-1.5 py-1">
      <time
        className="font-extended text-[0.68rem] font-medium tracking-[0.02em] text-black/30"
        dateTime={props.timestamp}
      >
        {dateLabel}
      </time>
      <span className="h-px w-28 bg-black/10" />
    </div>
  );
}
