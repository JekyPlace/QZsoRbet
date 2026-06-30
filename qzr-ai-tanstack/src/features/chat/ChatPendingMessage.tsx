import {
  useChatPendingMessage,
  type ChatPendingMessageProps,
} from "./chatPendingMessage.brain";

export default function ChatPendingMessage(props: ChatPendingMessageProps) {
  const { content } = useChatPendingMessage(props.content);

  return (
    <div className="flex w-full justify-end">
      <article className="w-fit max-w-[92%] rounded-xl rounded-br-sm border-2 border-black bg-black px-3 py-2.5 text-[0.95rem] text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.12)] sm:max-w-[72%] sm:px-4 sm:py-3">
        <p className="m-0 leading-6 whitespace-pre-wrap break-words">
          {content}
        </p>
      </article>
    </div>
  );
}
