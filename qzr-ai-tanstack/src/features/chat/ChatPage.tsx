import ChatErrorState from "./ChatErrorState";
import ChatHeader from "./ChatHeader";
import ChatLoadingState from "./ChatLoadingState";
import ChatMessages from "./ChatMessages";
import ChatPromptBuilder from "./ChatPromptBuilder";
import { useChatPage, type ChatPageProps } from "./chatPage.brain";

export default function ChatPage(props: ChatPageProps) {
  const { shouldShowError, shouldShowPromptBuilder } = useChatPage(props);

  return (
    <div className="flex h-[calc(100vh-2.5rem)] min-h-0 flex-col sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {props.chat && (
        <ChatHeader
          hasNoModels={props.hasNoModels}
          isModelsLoading={props.isModelsLoading}
          isSending={props.isSending}
          label={props.chat.label}
          models={props.models}
          modelsError={props.modelsError}
          selectedModel={props.selectedModel}
          setSelectedModel={props.setSelectedModel}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-5 text-black sm:gap-6">
        {props.isChatLoading && <ChatLoadingState />}

        {shouldShowError && props.chatError && (
          <ChatErrorState
            error={props.chatError}
            isRetrying={props.isChatFetching}
            onRetry={props.refetchChat}
          />
        )}

        {props.chat && (
          <ChatMessages
            chat={props.chat}
            isSending={props.isSending}
            pendingMessage={props.pendingMessage}
            streamingMessage={props.streamingMessage}
          />
        )}
      </div>

      {shouldShowPromptBuilder && (
        <ChatPromptBuilder
          hasNoModels={props.hasNoModels}
          isSending={props.isSending}
          message={props.message}
          sendError={props.sendError}
          sendMessage={props.sendMessage}
          setMessage={props.setMessage}
        />
      )}
    </div>
  );
}
