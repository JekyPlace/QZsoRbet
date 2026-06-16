import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Ellipsis,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import useChat from "#/hooks/useChat";
import type { Chat } from "#/hooks/useChat";

export type { Chat } from "#/hooks/useChat";
import logo from "../assets/logo.png";

type SidebarProps = {
  expanded: boolean;
};

function Sidebar({ expanded }: SidebarProps) {
  const navigate = useNavigate();
  const [_expanded, setExpanded] = useState(() =>
    typeof window === "undefined"
      ? expanded
      : window.matchMedia("(min-width: 768px)").matches && expanded,
  );
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const {
    chats,
    error,
    deleteChat,
    isDeleting,
    deleteError,
    clearDeleteError,
  } = useChat();

  const openDeleteDialog = (chat: Chat) => {
    clearDeleteError();
    setOpenMenuChatId(null);
    setChatToDelete(chat);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;

    clearDeleteError();
    setChatToDelete(null);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;

    try {
      await deleteChat(chatToDelete.id);
      setChatToDelete(null);
      await navigate({ to: "/" });
    } catch {
      // L'errore della mutation viene mostrato nel popup.
    }
  };

  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-20 flex max-w-[calc(100vw-1rem)] flex-col border-r-2 border-black bg-[#fff333] shadow-[6px_0_0_rgb(0_0_0/0.12)] transition-[width] duration-200 md:shadow-none ${
        _expanded
          ? "sidebar-expanded w-[min(22rem,calc(100vw-1rem))]"
          : "sidebar-collapsed w-16 sm:w-18"
      }`}
    >
      <header
        className={`flex h-18 shrink-0 items-center border-b-2 border-black ${
          _expanded ? "justify-between px-4" : "justify-center"
        }`}
      >
        {_expanded && (
          <Link
            to="/"
            className="text-lg tracking-[0.12em] text-black flex items-center gap-x-1 font-weight-bold"
          >
            <img className="w-12" src={logo}></img>
            <h4 className="uppercase text-3xl ml-2">QZsoRbet</h4>
            <span className="text-xs">by</span>
            <h4 className="text-3xl uppercase">QZR</h4>
          </Link>
        )}

        <button
          type="button"
          aria-label={_expanded ? "Chiudi sidebar" : "Espandi sidebar"}
          aria-expanded={_expanded}
          className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-[#fff333] text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
          onClick={() => setExpanded((current) => !current)}
        >
          {_expanded ? <X size={20} /> : <ArrowRight size={20} />}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 sm:gap-4 sm:p-3">
        <Link
          to="/"
          aria-label="Nuova chat"
          className={`flex min-h-11 items-center rounded-lg border-2 border-black bg-black font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black ${
            _expanded ? "gap-3 px-3" : "justify-center"
          }`}
        >
          <Plus size={20} />
          {_expanded && <span>Nuova chat</span>}
        </Link>

        {_expanded && (
          <p className="m-0 px-1 text-base font-bold uppercase">
            Conversazioni
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && _expanded && (
            <p className="m-0 rounded-lg border-2 border-black bg-[#fff27a] p-3 text-sm">
              {error}
            </p>
          )}

          {chats?.length > 0 ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {chats.map((chat) => (
                <li key={chat.id} className="relative flex gap-1">
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: chat.id }}
                    aria-label={chat.label}
                    activeProps={{ className: "bg-black text-[#fff333]" }}
                    inactiveProps={{ className: "bg-[#fff333] text-black" }}
                    className={`flex min-h-12 min-w-0 flex-1 items-center rounded-lg border-2 border-black transition hover:bg-[#fff06a] hover:text-black ${
                      _expanded ? "gap-3 px-3" : "justify-center"
                    }`}
                  >
                    <MessageSquare size={18} className="shrink-0" />
                    {_expanded && (
                      <span className="min-w-0 truncate font-medium">
                        {chat.label}...
                      </span>
                    )}
                  </Link>

                  {_expanded && (
                    <button
                      type="button"
                      aria-label={`Opzioni per ${chat.label}`}
                      aria-expanded={openMenuChatId === chat.id}
                      className="grid size-12 shrink-0 place-items-center rounded-lg border-2 border-black bg-[#fff333] text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30"
                      onClick={() =>
                        setOpenMenuChatId((current) =>
                          current === chat.id ? null : chat.id,
                        )
                      }
                    >
                      <Ellipsis size={20} />
                    </button>
                  )}

                  {openMenuChatId === chat.id && (
                    <div className="absolute top-0 right-[3.25rem] z-30 w-44 rounded-lg border-2 border-black bg-[#fff27a] p-1 shadow-[4px_4px_0_rgb(0_0_0/0.2)]">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-black transition hover:bg-black hover:text-[#fff333] focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-black/30"
                        onClick={() => openDeleteDialog(chat)}
                      >
                        <Trash2 size={17} />
                        Elimina chat
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            _expanded &&
            !error && (
              <p className="m-0 rounded-lg border-2 border-dashed border-black p-3 text-sm">
                Nessuna chat
              </p>
            )
          )}
        </div>
      </div>

      {chatToDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          role="presentation"
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
            aria-describedby="delete-chat-description"
            className="w-full max-w-md rounded-xl border-2 border-black bg-[#fff333] p-5 text-black shadow-[6px_6px_0_rgb(0_0_0/0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-chat-title" className="m-0 text-xl font-black">
              Eliminare la chat?
            </h2>
            <p id="delete-chat-description" className="mt-2 mb-0">
              Stai per eliminare “{chatToDelete.label}”. Questa azione non può
              essere annullata.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-3 mb-0 rounded-lg border-2 border-black bg-[#fff27a] p-3 text-sm font-medium"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                className="rounded-lg border-2 border-black bg-[#fff27a] px-4 py-2 font-bold text-black transition hover:bg-[#fff06a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={closeDeleteDialog}
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isDeleting}
                className="rounded-lg border-2 border-black bg-black px-4 py-2 font-bold text-[#fff333] transition hover:bg-[#fff06a] hover:text-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={confirmDelete}
              >
                {isDeleting ? "Eliminazione..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
