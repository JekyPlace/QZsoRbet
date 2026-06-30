import MarkdownMessage from "#/components/MarkdownMessage";
import {
  useChatMessageBubble,
  type ChatMessageBubbleProps,
} from "./chatMessageBubble.brain";

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { isHuman, messageTime } = useChatMessageBubble(message);

  return (
    <div
      className={`group/message flex w-full flex-col ${
        isHuman ? "items-end" : "items-start"
      }`}
    >
      <article
        className={`min-w-0 rounded-xl px-3 py-2.5 text-[0.95rem] sm:px-4 sm:py-3 ${
          isHuman
            ? "w-fit max-w-[92%] rounded-br-sm border-2 border-black bg-black text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.12)] sm:max-w-[72%]"
            : "w-full rounded-bl-sm border border-black/20 bg-[#fff27a] text-black shadow-[1px_1px_0_rgb(0_0_0/0.06)] lg:max-w-[86%]"
        }`}
      >
        {message.from === "CHATBOT" ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <p className="m-0 leading-6 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </article>
      <div className="mt-1 flex items-center gap-1.5 px-1 font-mono text-[0.58rem] leading-none text-black/35 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
        <span>{isHuman ? "tu" : "QZsoRbet agent"}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={message.timestamp}>{messageTime}</time>
      </div>
    </div>
  );
}
