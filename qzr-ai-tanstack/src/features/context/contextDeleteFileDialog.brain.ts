import type { ContextFile } from "#/types/api.types";

export type ContextDeleteFileDialogProps = {
  file: ContextFile;
  deleteError: string | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function useContextDeleteFileDialog({
  file,
  isDeleting,
}: ContextDeleteFileDialogProps) {
  return {
    confirmLabel: isDeleting ? "Eliminazione..." : "Elimina",
    description: `Stai per eliminare “${file.name}”. Il documento e il relativo contesto indicizzato verranno rimossi.`,
    title: "Eliminare il documento?",
  };
}
