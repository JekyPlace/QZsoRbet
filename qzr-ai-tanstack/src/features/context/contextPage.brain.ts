import type { DragEvent } from "react";
import { useState } from "react";

const ACCEPTED_EXTENSIONS = [".csv", ".pdf"] as const;

function isAcceptedFile(file: File) {
  const fileName = file.name.toLowerCase();

  return ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

export function useContextPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const invalidFiles = files.filter((file) => !isAcceptedFile(file));

    if (invalidFiles.length > 0) {
      setAcceptedFiles([]);
      setError("Formato non supportato. Usa solo file CSV o PDF.");
      return;
    }

    setAcceptedFiles(files);
    setError(null);
  }

  return {
    acceptedFiles,
    error,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isDragging,
  };
}

export type ContextPageState = ReturnType<typeof useContextPage>;
