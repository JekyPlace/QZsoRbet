export type ChatPendingMessageProps = {
  content: string;
};

export function useChatPendingMessage(content: string) {
  return {
    authorLabel: "Tu",
    content,
  };
}
