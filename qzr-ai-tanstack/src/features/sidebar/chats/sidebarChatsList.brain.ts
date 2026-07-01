import type { Chat } from "#/types/api.types";
import { capitalizeFirstLetter } from "#/utils/formatText";
import { useMemo, useState } from "react";

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
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
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
    searchQuery,
    setSearchQuery,
    shouldShowNoResults:
      expanded && !error && chats.length > 0 && filteredChats.length === 0,
    shouldShowSearch: expanded && chats.length > 0,
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
