import ChatDateSeparator from "./ChatDateSeparator";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatPendingMessage from "./ChatPendingMessage";
import ChatStreamingMessage from "./ChatStreamingMessage";
import {
  useChatMessages,
  type ChatMessagesProps,
} from "./chatMessages.brain";

export default function ChatMessages(props: ChatMessagesProps) {
  const { containerRef, messages } = useChatMessages(props);

  return (
    <div
      ref={containerRef}
      className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-1 text-black"
    >
      <div className="flex min-h-full flex-col gap-5 sm:gap-6">
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

        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
}
