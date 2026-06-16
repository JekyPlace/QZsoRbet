import { createFileRoute } from "@tanstack/react-router";
import MarkdownMessage from "#/components/MarkdownMessage";
import useChat from "#/hooks/useChat";

export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
});

function formatMessageTime(timestamp?: string) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function RouteComponent() {
  const { chatId } = Route.useParams();
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
  } = useChat(chatId);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col sm:min-h-[calc(100vh-5rem)]">
      {chat && (
        <header className="mb-5 border-b-2 border-black pb-4 sm:mb-7">
          <p className="m-0 text-base font-bold uppercase opacity-70">
            Conversazione
          </p>
          <h1 className="mt-1 mb-0 truncate text-xl font-black sm:text-2xl">
            {chat.label}
          </h1>
        </header>
      )}

      <div className="flex flex-1 flex-col gap-5 text-black sm:gap-6">
        {isChatLoading && (
          <div
            className="grid flex-1 place-items-center"
            aria-live="polite"
            aria-label="Caricamento chat"
          >
            <div className="flex items-center gap-3 rounded-lg border-2 border-black bg-[#fff27a] px-4 py-3 font-bold">
              <span className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Caricamento chat...
            </div>
          </div>
        )}

        {chatError && !chat && !isChatLoading && (
          <div className="grid flex-1 place-items-center">
            <div
              className="w-full max-w-md rounded-xl border-2 border-black bg-[#fff27a] p-4 text-center"
              role="alert"
            >
              <h3 className="m-0 text-lg font-black">
                Impossibile caricare la chat
              </h3>
              <p className="my-2 text-sm">{chatError}</p>
              <button
                type="button"
                disabled={isChatFetching}
                className="rounded-lg border-2 border-black bg-black px-4 py-2 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => refetchChat()}
              >
                {isChatFetching ? "Caricamento..." : "Riprova"}
              </button>
            </div>
          </div>
        )}

        {chat &&
          chat?.messages?.map((message) => (
            <div
              className={`flex w-full ${
                message.from === "HUMAN" ? "justify-end" : "justify-start"
              }`}
              key={message.id}
            >
              <article
                className={`min-w-0 rounded-2xl border-2 border-black px-4 py-3.5 text-[0.98rem] shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:px-5 sm:py-4 sm:text-base ${
                  message.from === "HUMAN"
                    ? "w-fit max-w-[92%] rounded-br-sm bg-black text-[#fff333] sm:max-w-[72%]"
                    : "w-full rounded-bl-sm bg-[#fff27a] text-black lg:max-w-[92%]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-6 uppercase">
                  <span
                    className={`rounded-full border px-3 py-1 text-base font-bold ${
                      message.from === "HUMAN"
                        ? "border-[#fff333]/35 bg-[#fff333]/12 text-[#fff27a]"
                        : "border-black/20 bg-black/5 text-black/65"
                    }`}
                  >
                    {message.from === "HUMAN" ? "Tu" : "AI"}
                  </span>
                  <time
                    className="font-mono text-xs opacity-45"
                    dateTime={message.timestamp}
                  >
                    {formatMessageTime(message.timestamp)}
                  </time>
                </div>
                {message.from === "CHATBOT" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <p className="m-0 leading-7 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </article>
            </div>
          ))}

        {pendingMessage && (
          <div className="flex w-full justify-end">
            <article className="w-fit max-w-[92%] rounded-2xl rounded-br-sm border-2 border-black bg-black px-4 py-3.5 text-[0.98rem] text-[#fff333] shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:max-w-[72%] sm:px-5 sm:py-4 sm:text-base">
              <div className="mb-3 w-fit rounded-full border border-[#fff333]/35 bg-[#fff333]/12 px-3 py-1 text-base font-bold text-[#fff27a] uppercase">
                Tu
              </div>
              <p className="m-0 leading-7 whitespace-pre-wrap break-words">
                {pendingMessage}
              </p>
            </article>
          </div>
        )}

        {(isSending || streamingMessage) && (
          <div className="flex w-full justify-start" aria-live="polite">
            <article className="w-full min-w-0 rounded-2xl rounded-bl-sm border-2 border-black bg-[#fff27a] px-4 py-3.5 text-[0.98rem] text-black shadow-[3px_3px_0_rgb(0_0_0/0.12)] sm:px-5 sm:py-4 sm:text-base lg:max-w-[92%]">
              <div className="mb-3 w-fit rounded-full border border-black/20 bg-black/5 px-3 py-1 text-base font-bold text-black/65 uppercase">
                AI
              </div>
              {streamingMessage ? (
                <MarkdownMessage content={streamingMessage} />
              ) : (
                <div
                  className="flex items-center gap-1.5 py-1"
                  aria-label="AI sta scrivendo"
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-2 animate-bounce rounded-full bg-black"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
            </article>
          </div>
        )}
      </div>

      {!isChatLoading && chat && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="sticky bottom-0 mt-6 flex flex-col gap-2 border-t-2 border-black bg-[#fff333] pt-4 min-[560px]:flex-row min-[560px]:flex-wrap min-[560px]:items-end sm:mt-8 sm:pt-5"
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Scrivi un messaggio"
            placeholder="Scrivi un messaggio..."
            rows={2}
            className="min-h-14 min-w-0 flex-1 resize-y rounded-xl border-2 border-black bg-[#fff27a] px-4 py-3 leading-6 text-black outline-none transition placeholder:text-black/50 focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20"
          />
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="min-h-14 shrink-0 rounded-xl border-2 border-black bg-black px-6 py-3 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Invia
          </button>

          {sendError && (
            <p
              className="m-0 text-sm font-medium text-black min-[440px]:basis-full"
              role="alert"
            >
              {sendError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
