import { Link } from "@tanstack/react-router";
import { MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SidebarChatControls from "../composition/SidebarChatControls";
import {
  useSidebarChatItem,
  useSidebarChatsList,
  type SidebarChatsListProps,
} from "./sidebarChatsList.brain";

type ChatTooltip = {
  label: string;
  left: number;
  top: number;
};

export default function SidebarChatsList(props: SidebarChatsListProps) {
  const [chatTooltip, setChatTooltip] = useState<ChatTooltip | null>(null);
  const {
    filteredChats,
    hasChats,
    hasFilteredChats,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    shouldShowEmptyState,
    shouldShowError,
    shouldShowNoResults,
    shouldShowSearch,
    toggleSearch,
  } = useSidebarChatsList(props);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldShowSearch) searchInputRef.current?.focus();
  }, [shouldShowSearch]);

  return (
    <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
      <div className="mb-3">
        <SidebarChatControls
          expanded={props.expanded}
          isSearchOpen={isSearchOpen}
          onNavigate={props.onNavigate}
          onSearchChange={setSearchQuery}
          onSearchToggle={toggleSearch}
          searchDisabled={!hasChats}
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
        />
      </div>

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
              setChatTooltip={setChatTooltip}
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
      {chatTooltip && !props.expanded && (
        <div
          className="pointer-events-none fixed z-50 max-w-56 -translate-y-1/2 truncate rounded-lg bg-[#fff27a] px-2.5 py-1.5 text-xs font-medium text-black/75 shadow-[3px_3px_0_rgb(0_0_0/0.18)]"
          style={{ left: chatTooltip.left, top: chatTooltip.top }}
        >
          {chatTooltip.label}
        </div>
      )}
    </div>
  );
}

type SidebarChatItemProps = {
  chat: SidebarChatsListProps["chats"][number];
  expanded: boolean;
  onDeleteChat: SidebarChatsListProps["onDeleteChat"];
  onNavigate: SidebarChatsListProps["onNavigate"];
  setChatTooltip: (tooltip: ChatTooltip | null) => void;
};

function SidebarChatItem({
  chat,
  expanded,
  onDeleteChat,
  onNavigate,
  setChatTooltip,
}: SidebarChatItemProps) {
  const { chatLabel, itemClassName, linkClassName } = useSidebarChatItem(
    chat,
    expanded,
  );

  function showTooltip(element: HTMLElement) {
    if (expanded) return;

    const rect = element.getBoundingClientRect();
    setChatTooltip({
      label: chatLabel,
      left: rect.right + 8,
      top: rect.top + rect.height / 2,
    });
  }

  return (
    <li className={itemClassName}>
      <Link
        to="/chat/$chatId"
        params={{ chatId: chat.id }}
        aria-label={chatLabel}
        onClick={onNavigate}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setChatTooltip(null)}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setChatTooltip(null)}
        activeProps={{
          "aria-current": "page",
          className:
            "border-black bg-black text-[#fff333] shadow-[2px_2px_0_rgb(0_0_0/0.18)]",
        }}
        inactiveProps={{ className: "bg-[#fff333] text-black" }}
        className={linkClassName}
      >
        <MessageSquare size={14} className="shrink-0" />
        {expanded && (
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {chatLabel}
          </span>
        )}
      </Link>

      {expanded && (
        <button
          type="button"
          aria-label={`Elimina ${chatLabel}`}
          className="absolute top-0 right-0 grid size-10 translate-x-full place-items-center rounded-lg text-black/45 opacity-0 transition hover:bg-black hover:text-[#fff333] hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black/30 group-hover/chat-item:translate-x-0 group-hover/chat-item:opacity-100 group-focus-within/chat-item:translate-x-0 group-focus-within/chat-item:opacity-100"
          onClick={() => onDeleteChat(chat)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </li>
  );
}
