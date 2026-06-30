import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import useChat from "#/hooks/useChat";
import type { Chat } from "#/types/api.types";

export type SidebarProps = {
  expanded: boolean;
};

function getInitialExpanded(expanded: boolean) {
  if (typeof window === "undefined") return expanded;

  return window.matchMedia("(min-width: 768px)").matches && expanded;
}

export function useSidebar({ expanded }: SidebarProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() =>
    getInitialExpanded(expanded),
  );
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const {
    chats,
    error,
    deleteChat,
    isDeleting,
    deleteError,
    clearDeleteError,
  } = useChat();

  function toggleSidebar() {
    setIsExpanded((current) => !current);
  }

  function closeSidebarOnMobile() {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    setIsExpanded(false);
  }

  function openDeleteDialog(chat: Chat) {
    clearDeleteError();
    setChatToDelete(chat);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;

    clearDeleteError();
    setChatToDelete(null);
  }

  async function confirmDelete() {
    if (!chatToDelete) return;

    try {
      await deleteChat(chatToDelete.id);
      setChatToDelete(null);
      await navigate({ to: "/" });
    } catch {
      // L'errore della mutation viene mostrato nel popup.
    }
  }

  return {
    chatToDelete,
    chats,
    closeSidebarOnMobile,
    closeDeleteDialog,
    confirmDelete,
    deleteError,
    error,
    isDeleting,
    isExpanded,
    openDeleteDialog,
    toggleSidebar,
  };
}
