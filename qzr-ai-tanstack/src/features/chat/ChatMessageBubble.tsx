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
        className={`min-w-0 rounded-xl border-2 border-black px-3 py-2.5 text-[0.95rem] shadow-[2px_2px_0_rgb(0_0_0/0.12)] sm:px-4 sm:py-3 ${
          isHuman
            ? "w-fit max-w-[92%] rounded-br-sm bg-black text-[#fff333] sm:max-w-[72%]"
            : "w-full rounded-bl-sm bg-[#fff27a] text-black lg:max-w-[92%]"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-4 uppercase">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${
              isHuman
                ? "border-[#fff333]/35 bg-[#fff333]/12 text-[#fff27a]"
                : "border-black/20 bg-black/5 text-black/65"
            }`}
          >
            {authorLabel}
          </span>
          <time
            className="font-mono text-[0.68rem] opacity-45"
            dateTime={message.timestamp}
          >
            {messageTime}
          </time>
        </div>
        {message.from === "CHATBOT" ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <p className="m-0 leading-6 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </article>
    </div>
  );
}
