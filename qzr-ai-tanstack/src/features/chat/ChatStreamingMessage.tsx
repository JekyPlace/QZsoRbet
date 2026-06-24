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
      <article className="w-full min-w-0 rounded-2xl rounded-bl-sm border-2 border-black bg-[#fff27a] px-4 py-3.5 text-[0.98rem] text-black shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:px-5 sm:py-4 sm:text-base lg:max-w-[92%]">
        <div className="mb-3 w-fit rounded-full border border-black/20 bg-black/5 px-3 py-1 text-base font-bold text-black/65 uppercase">
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
