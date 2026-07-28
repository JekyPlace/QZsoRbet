import type { Chat } from "#/types/api.types";
import { capitalizeFirstLetter } from "#/utils/formatText";
import { useEffect, useMemo, useState } from "react";

const EMPTY_SEARCH_AUTO_CLOSE_MS = 5_000;

export type SidebarChatsListProps = {
  chats: Chat[];
  error: string | null;
  expanded: boolean;
  onDeleteChat: (chat: Chat) => void;
  onNavigate: () => void;
};

export function useSidebarChatsList({
  chats,
  error,
  expanded,
}: SidebarChatsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (!isSearchOpen || searchQuery.length > 0) return;

    const timeoutId = window.setTimeout(() => {
      setIsSearchOpen(false);
    }, EMPTY_SEARCH_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchOpen, searchQuery]);

  const filteredChats = useMemo(() => {
    if (!normalizedSearchQuery) return chats;

    return chats.filter((chat) =>
      chat.label.toLowerCase().includes(normalizedSearchQuery),
    );
  }, [chats, normalizedSearchQuery]);

  return {
    hasChats: chats.length > 0,
    filteredChats,
    hasFilteredChats: filteredChats.length > 0,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    toggleSearch: () => {
      setIsSearchOpen((currentValue) => {
        if (currentValue) setSearchQuery("");
        return !currentValue;
      });
    },
    shouldShowNoResults:
      expanded && !error && chats.length > 0 && filteredChats.length === 0,
    shouldShowSearch: expanded && chats.length > 0 && isSearchOpen,
    shouldShowEmptyState: expanded && !error && chats.length === 0,
    shouldShowError: Boolean(error && expanded),
  };
}

export function useSidebarChatItem(chat: Chat, expanded: boolean) {
  const chatLabel = capitalizeFirstLetter(chat.label);

  return {
    chatLabel,
    itemClassName: "group/chat-item relative w-full min-w-0 overflow-hidden",
    linkClassName: `group relative flex min-h-10 min-w-0 items-center overflow-hidden rounded-lg border border-black/15 transition hover:border-black/30 hover:bg-[#fff06a] hover:text-black ${
      expanded
        ? "w-full gap-2.5 px-2.5 py-0.5 group-hover/chat-item:-translate-x-11 group-focus-within/chat-item:-translate-x-11"
        : "justify-center"
    }`,
  };
}
