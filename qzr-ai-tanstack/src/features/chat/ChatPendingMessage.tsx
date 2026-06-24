import {
  useChatPendingMessage,
  type ChatPendingMessageProps,
} from "./chatPendingMessage.brain";

export default function ChatPendingMessage(props: ChatPendingMessageProps) {
  const { authorLabel, content } = useChatPendingMessage(props.content);

  return (
    <div className="flex w-full justify-end">
      <article className="w-fit max-w-[92%] rounded-2xl rounded-br-sm border-2 border-black bg-black px-4 py-3.5 text-[0.98rem] text-[#fff333] shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:max-w-[72%] sm:px-5 sm:py-4 sm:text-base">
        <div className="mb-3 w-fit rounded-full border border-[#fff333]/35 bg-[#fff333]/12 px-3 py-1 text-base font-bold text-[#fff27a] uppercase">
          {authorLabel}
        </div>
        <p className="m-0 leading-7 whitespace-pre-wrap break-words">
          {content}
        </p>
      </article>
    </div>
  );
}
