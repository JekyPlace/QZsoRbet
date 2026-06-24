export type ChatLoadingStateProps = {
  label?: string;
  message?: string;
};

export function useChatLoadingState({
  label = "Caricamento chat",
  message = "Caricamento chat...",
}: ChatLoadingStateProps) {
  return {
    label,
    message,
  };
}
