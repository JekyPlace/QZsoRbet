import type { DragEvent } from "react";
import { useEffect, useState } from "react";
import { getContextFiles, uploadContextFile } from "#/services/network";
import type { ContextFile, ContextUploadResponse } from "#/types/api.types";

const ACCEPTED_EXTENSIONS = [".csv", ".pdf"] as const;

function isAcceptedFile(file: File) {
  const fileName = file.name.toLowerCase();

  return ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

export function useContextPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<ContextUploadResponse[]>(
    [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadContextFiles() {
    setIsLoadingFiles(true);

    try {
      setContextFiles(await getContextFiles());
    } catch (filesError) {
      setError(
        filesError instanceof Error
          ? filesError.message
          : "Impossibile caricare i file.",
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }

  useEffect(() => {
    void loadContextFiles();
  }, []);

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

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const invalidFiles = files.filter((file) => !isAcceptedFile(file));

    if (invalidFiles.length > 0) {
      setUploadedFiles([]);
      setError("Formato non supportato. Usa solo file CSV o PDF.");
      return;
    }

    setIsUploading(true);
    setUploadedFiles([]);
    setError(null);

    try {
      const results: ContextUploadResponse[] = [];

      for (const file of files) {
        results.push(await uploadContextFile(file));
      }

      setUploadedFiles(results);
      await loadContextFiles();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload o indicizzazione non riusciti.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return {
    contextFiles,
    error,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isDragging,
    isLoadingFiles,
    isUploading,
    uploadedFiles,
  };
}

export type ContextPageState = ReturnType<typeof useContextPage>;
