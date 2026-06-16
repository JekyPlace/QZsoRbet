import { createFileRoute } from "@tanstack/react-router";
import Sidebar from "../features/Sidebar";
import { useState } from "react";
import { handleSubmit } from "../services/form";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createChat = async () => {
    if (!message.trim() || isCreating) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      await handleSubmit(message, navigate);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Non è stato possibile creare la chat.",
      );
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen pl-16 transition-[padding] duration-200 has-[.sidebar-collapsed]:pl-16 sm:pl-18 sm:has-[.sidebar-collapsed]:pl-18 md:pl-88">
      <Sidebar expanded={true} />
      <main className="grid min-h-screen place-items-center px-3 py-6 sm:px-6 md:p-8">
        {isCreating ? (
          <div
            className="flex w-full max-w-176 flex-col items-center gap-4 rounded-xl border-2 border-black bg-[#fff333] p-8 text-center text-black shadow-[6px_6px_0_rgb(0_0_0/0.12)]"
            aria-live="polite"
            aria-label="Creazione chat in corso"
          >
            <span className="size-8 animate-spin rounded-full border-3 border-black border-t-transparent" />
            <div>
              <p className="m-0 text-lg font-bold">Creazione della chat...</p>
              <p className="mt-1 mb-0 text-sm opacity-65">
                QZSorbet sta preparando la risposta.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createChat();
            }}
            className="flex w-full max-w-176 flex-col gap-3 rounded-xl border-2 border-black bg-[#fff333] p-4 leading-relaxed text-black sm:gap-4 sm:p-6 md:p-8"
          >
            <p className="m-0">
              Ciao, sono <b className="text-lg">QZSorbet.ai</b> Sono un
              assistente virtuale creato da QZR. Come posso aiutarti oggi?
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-32 w-full resize-y rounded-lg border-2 border-black bg-[#fff27a] px-4 py-3 leading-relaxed text-black outline-none transition placeholder:text-[#4a4200] focus:bg-[#fff6a3] focus:ring-3 focus:ring-black/20"
              placeholder="Inserisci qui la tua domanda"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="w-full rounded-lg border-2 border-black bg-black px-4 py-3 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Invia
            </button>
            {createError && (
              <p className="m-0 text-sm font-medium text-black" role="alert">
                {createError}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
