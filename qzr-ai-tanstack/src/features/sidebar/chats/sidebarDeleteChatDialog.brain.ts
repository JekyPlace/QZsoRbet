import type { Chat } from "#/types/api.types";

export type SidebarDeleteChatDialogProps = {
  chat: Chat;
  deleteError: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function useSidebarDeleteChatDialog({
  chat,
  isDeleting,
}: SidebarDeleteChatDialogProps) {
  return {
    confirmLabel: isDeleting ? "Eliminazione..." : "Elimina",
    description: `Stai per eliminare “${chat.label}”. Questa azione non può essere annullata.`,
    title: "Eliminare la chat?",
  };
}
