import type { Chat } from "#/types/api.types";
import formatDate from "#/utils/formatDate";
import { capitalizeFirstLetter } from "#/utils/formatText";

export type SidebarChatsListProps = {
  chats: Chat[];
  error: string | null;
  expanded: boolean;
  onDeleteChat: (chat: Chat) => void;
};

export function useSidebarChatsList({
  chats,
  error,
  expanded,
}: SidebarChatsListProps) {
  return {
    hasChats: chats.length > 0,
    shouldShowEmptyState: expanded && !error && chats.length === 0,
    shouldShowError: Boolean(error && expanded),
  };
}

export function useSidebarChatItem(chat: Chat, expanded: boolean) {
  const chatLabel = capitalizeFirstLetter(chat.label);

  return {
    chatLabel,
    formattedDate: formatDate(chat.lastModification),
    itemClassName: `grid w-full min-w-0 gap-1 ${
      expanded ? "grid-cols-[minmax(0,1fr)_3rem]" : ""
    }`,
    linkClassName: `flex min-h-12 min-w-0 items-center overflow-hidden rounded-lg border-2 border-black transition hover:bg-[#fff06a] hover:text-black ${
      expanded ? "gap-3 px-3" : "justify-center"
    }`,
  };
}
