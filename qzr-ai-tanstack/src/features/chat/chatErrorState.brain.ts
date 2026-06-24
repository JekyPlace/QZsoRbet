export type ChatErrorStateProps = {
  error: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export function useChatErrorState({ isRetrying }: ChatErrorStateProps) {
  return {
    retryLabel: isRetrying ? "Caricamento..." : "Riprova",
    title: "Impossibile caricare la chat",
  };
}
