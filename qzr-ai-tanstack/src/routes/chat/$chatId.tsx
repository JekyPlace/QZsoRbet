import { createFileRoute } from "@tanstack/react-router";
import ChatPage from "#/features/chat/ChatPage";
import useChat from "#/hooks/useChat";
import useOllamaModels from "#/hooks/useOllamaModels";

export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId } = Route.useParams();
  const {
    models,
    selectedModel,
    setSelectedModel,
    modelsError,
    isModelsLoading,
    hasNoModels,
  } = useOllamaModels();
  const {
    sendMessage,
    message,
    setMessage,
    isSending,
    sendError,
    chat,
    chatError,
    isChatLoading,
    isChatFetching,
    refetchChat,
    pendingMessage,
    streamingMessage,
  } = useChat(chatId, selectedModel);
  return (
    <ChatPage
      chat={chat}
      chatError={chatError}
      hasNoModels={hasNoModels}
      isChatFetching={isChatFetching}
      isChatLoading={isChatLoading}
      isModelsLoading={isModelsLoading}
      isSending={isSending}
      message={message}
      models={models}
      modelsError={modelsError}
      pendingMessage={pendingMessage}
      refetchChat={refetchChat}
      selectedModel={selectedModel}
      sendError={sendError}
      sendMessage={sendMessage}
      setMessage={setMessage}
      setSelectedModel={setSelectedModel}
      streamingMessage={streamingMessage}
    />
  );
}
