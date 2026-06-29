import ChatDateSeparator from "./ChatDateSeparator";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatPendingMessage from "./ChatPendingMessage";
import ChatStreamingMessage from "./ChatStreamingMessage";
import {
  useChatMessages,
  type ChatMessagesProps,
} from "./chatMessages.brain";

export default function ChatMessages(props: ChatMessagesProps) {
  const { bottomRef, messages } = useChatMessages(props);

  return (
    <div className="flex flex-1 flex-col gap-5 text-black sm:gap-6">
      {messages.map((message, index) => {
        const previousMessage = messages[index - 1];

        return (
          <div key={message.id} className="contents">
            <ChatDateSeparator
              timestamp={message.timestamp}
              previousTimestamp={previousMessage?.timestamp}
            />
            <ChatMessageBubble message={message} />
          </div>
        );
      })}

      {props.pendingMessage && (
        <ChatPendingMessage content={props.pendingMessage} />
      )}

      {(props.isSending || props.streamingMessage) && (
        <ChatStreamingMessage content={props.streamingMessage} />
      )}

      <div ref={bottomRef} className="h-72 shrink-0 min-[560px]:h-36 sm:h-40" />
    </div>
  );
}
