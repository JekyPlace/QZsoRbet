import { Link } from "@tanstack/react-router";
import { MessageSquare, Search, Trash2 } from "lucide-react";
import {
  useSidebarChatItem,
  useSidebarChatsList,
  type SidebarChatsListProps,
} from "./sidebarChatsList.brain";

export default function SidebarChatsList(props: SidebarChatsListProps) {
  const {
    filteredChats,
    hasChats,
    hasFilteredChats,
    searchQuery,
    setSearchQuery,
    shouldShowEmptyState,
    shouldShowError,
    shouldShowNoResults,
    shouldShowSearch,
  } = useSidebarChatsList(props);

  return (
    <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
      {shouldShowSearch && (
        <label className="mb-3 flex min-h-8 items-center gap-1.5 rounded-md border border-black/20 bg-[#fff27a]/60 px-2 text-black focus-within:border-black/35 focus-within:bg-[#fff6a3] focus-within:ring-2 focus-within:ring-black/15">
          <Search size={14} className="shrink-0 opacity-45" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cerca chat"
            className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-xs outline-none placeholder:text-black/40"
          />
        </label>
      )}

      {shouldShowError && (
        <p className="m-0 rounded-lg border border-black/20 bg-[#fff27a]/70 p-3 text-sm">
          {props.error}
        </p>
      )}

      {hasChats && hasFilteredChats ? (
        <ul className="m-0 grid w-full list-none gap-2 p-0">
          {filteredChats.map((chat) => (
            <SidebarChatItem
              key={chat.id}
              chat={chat}
              expanded={props.expanded}
              onDeleteChat={props.onDeleteChat}
              onNavigate={props.onNavigate}
            />
          ))}
        </ul>
      ) : shouldShowNoResults ? (
        <p className="m-0 rounded-lg border border-dashed border-black/25 p-3 text-sm text-black/65">
          Nessun risultato
        </p>
      ) : (
        shouldShowEmptyState && (
          <p className="m-0 rounded-lg border border-dashed border-black/25 p-3 text-sm text-black/65">
            Nessuna chat
          </p>
        )
      )}
    </div>
  );
}

type SidebarChatItemProps = {
  chat: SidebarChatsListProps["chats"][number];
  expanded: boolean;
  onDeleteChat: SidebarChatsListProps["onDeleteChat"];
  onNavigate: SidebarChatsListProps["onNavigate"];
};

function SidebarChatItem({
  chat,
  expanded,
  onDeleteChat,
  onNavigate,
}: SidebarChatItemProps) {
  const { chatLabel, formattedDate, itemClassName, linkClassName } =
    useSidebarChatItem(chat, expanded);

  return (
    <li className={itemClassName}>
      <Link
        to="/chat/$chatId"
        params={{ chatId: chat.id }}
        aria-label={chatLabel}
        onClick={onNavigate}
        activeProps={{
          "aria-current": "page",
          className:
            "border-black bg-black text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.18)]",
        }}
        inactiveProps={{ className: "bg-[#fff333] text-black" }}
        className={linkClassName}
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-current group-aria-[current=page]:block"
        />
        <MessageSquare size={17} className="shrink-0" />
        {expanded && (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{chatLabel}</span>
            <span className="font-mono text-[0.62rem] leading-3.5 opacity-45">
              {formattedDate}
            </span>
          </span>
        )}
      </Link>

      {expanded && (
        <button
          type="button"
          aria-label={`Elimina ${chatLabel}`}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-black/45 opacity-0 transition hover:bg-black hover:text-[#fff333] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 group-hover/chat-item:opacity-100"
          onClick={() => onDeleteChat(chat)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </li>
  );
}
