import {
  useChatPendingMessage,
  type ChatPendingMessageProps,
} from "./chatPendingMessage.brain";

export default function ChatPendingMessage(props: ChatPendingMessageProps) {
  const { authorLabel, content } = useChatPendingMessage(props.content);

  return (
    <div className="flex w-full justify-end">
      <article className="w-fit max-w-[92%] rounded-xl rounded-br-sm border-2 border-black bg-black px-3 py-2.5 text-[0.95rem] text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.12)] sm:max-w-[72%] sm:px-4 sm:py-3">
        <div className="mb-2 w-fit rounded-full border border-[#fff333]/35 bg-[#fff333]/12 px-2.5 py-0.5 text-sm font-bold text-[#fff27a] uppercase">
          {authorLabel}
        </div>
        <p className="m-0 leading-6 whitespace-pre-wrap break-words">
          {content}
        </p>
      </article>
    </div>
  );
}
