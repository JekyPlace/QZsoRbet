import MarkdownMessage from "#/components/MarkdownMessage";
import {
  useChatStreamingMessage,
  type ChatStreamingMessageProps,
} from "./chatStreamingMessage.brain";

export default function ChatStreamingMessage(props: ChatStreamingMessageProps) {
  const { authorLabel, bounceDelays, content, hasContent } =
    useChatStreamingMessage(props.content);

  return (
    <div className="flex w-full justify-start" aria-live="polite">
      <article className="w-full min-w-0 rounded-xl rounded-bl-sm border border-black/20 bg-[#fff27a] px-3 py-2.5 text-[0.95rem] text-black shadow-[1px_1px_0_rgb(0_0_0/0.06)] sm:px-4 sm:py-3 lg:max-w-[86%]">
        <div className="mb-2 w-fit rounded-full border border-black/20 bg-black/5 px-2.5 py-0.5 text-sm font-bold text-black/65 uppercase">
          {authorLabel}
        </div>
        {hasContent ? (
          <MarkdownMessage content={content} />
        ) : (
          <div
            className="flex items-center gap-1.5 py-1"
            aria-label="AI sta scrivendo"
          >
            {bounceDelays.map((delay) => (
              <span
                key={delay}
                className="size-2 animate-bounce rounded-full bg-black"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
