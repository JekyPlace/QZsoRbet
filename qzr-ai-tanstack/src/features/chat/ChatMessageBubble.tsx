import MarkdownMessage from "#/components/MarkdownMessage";
import {
  useChatMessageBubble,
  type ChatMessageBubbleProps,
} from "./chatMessageBubble.brain";

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { authorLabel, isHuman, messageTime } = useChatMessageBubble(message);

  return (
    <div className={`flex w-full ${isHuman ? "justify-end" : "justify-start"}`}>
      <article
        className={`min-w-0 rounded-2xl border-2 border-black px-4 py-3.5 text-[0.98rem] shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:px-5 sm:py-4 sm:text-base ${
          isHuman
            ? "w-fit max-w-[92%] rounded-br-sm bg-black text-[#fff333] sm:max-w-[72%]"
            : "w-full rounded-bl-sm bg-[#fff27a] text-black lg:max-w-[92%]"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-6 uppercase">
          <span
            className={`rounded-full border px-3 py-1 text-base font-bold ${
              isHuman
                ? "border-[#fff333]/35 bg-[#fff333]/12 text-[#fff27a]"
                : "border-black/20 bg-black/5 text-black/65"
            }`}
          >
            {authorLabel}
          </span>
          <time
            className="font-mono text-xs opacity-45"
            dateTime={message.timestamp}
          >
            {messageTime}
          </time>
        </div>
        {message.from === "CHATBOT" ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <p className="m-0 leading-7 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </article>
    </div>
  );
}
