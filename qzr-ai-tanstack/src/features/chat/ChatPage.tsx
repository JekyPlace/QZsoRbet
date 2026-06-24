import ChatErrorState from "./ChatErrorState";
import ChatHeader from "./ChatHeader";
import ChatLoadingState from "./ChatLoadingState";
import ChatMessages from "./ChatMessages";
import ChatPromptBuilder from "./ChatPromptBuilder";
import { useChatPage, type ChatPageProps } from "./chatPage.brain";

export default function ChatPage(props: ChatPageProps) {
  const { shouldShowError, shouldShowPromptBuilder } = useChatPage(props);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col sm:min-h-[calc(100vh-5rem)]">
      {props.chat && <ChatHeader label={props.chat.label} />}

      <div className="flex flex-1 flex-col gap-5 text-black sm:gap-6">
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
          isModelsLoading={props.isModelsLoading}
          isSending={props.isSending}
          message={props.message}
          models={props.models}
          modelsError={props.modelsError}
          selectedModel={props.selectedModel}
          sendError={props.sendError}
          sendMessage={props.sendMessage}
          setMessage={props.setMessage}
          setSelectedModel={props.setSelectedModel}
        />
      )}
    </div>
  );
}
