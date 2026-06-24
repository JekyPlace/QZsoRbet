export type ChatStreamingMessageProps = {
  content: string;
};

export function useChatStreamingMessage(content: string) {
  return {
    authorLabel: "AI",
    bounceDelays: [0, 150, 300],
    content,
    hasContent: content.length > 0,
  };
}
