import type { DragEvent } from "react";
import { useEffect, useState } from "react";
import {
  deleteContextFile,
  getContextFiles,
  uploadContextFile,
} from "#/services/network";
import type { ContextFile, ContextUploadResponse } from "#/types/api.types";

const ACCEPTED_EXTENSIONS = [".csv", ".pdf"] as const;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type UploadProgress = {
  completed: number;
  current: number;
  fileName: string;
  total: number;
};

function isAcceptedFile(file: File) {
  const fileName = file.name.toLowerCase();

  return (
    ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension)) &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE_BYTES
  );
}

export function useContextPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<ContextUploadResponse[]>(
    [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgress | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [deletingStoredName, setDeletingStoredName] = useState<string | null>(
    null,
  );
  const [fileToDelete, setFileToDelete] = useState<ContextFile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    if (isUploading) return;

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
    if (isUploading) return;

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const hasInvalidExtension = files.some((file) => {
      const fileName = file.name.toLowerCase();
      return !ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));
    });
    const hasEmptyFile = files.some((file) => file.size === 0);
    const hasOversizedFile = files.some(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );

    const hasInvalidFile = files.some((file) => !isAcceptedFile(file));

    if (hasInvalidFile) {
      setUploadedFiles([]);
      setError(
        hasOversizedFile
          ? "Ogni file deve pesare al massimo 25 MB."
          : hasEmptyFile
            ? "Non puoi caricare file vuoti."
            : hasInvalidExtension
              ? "Formato non supportato. Usa solo file CSV o PDF."
              : "File non valido.",
      );
      return;
    }

    setIsUploading(true);
    setUploadedFiles([]);
    setError(null);
    const results: ContextUploadResponse[] = [];

    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress({
          completed: index,
          current: index + 1,
          fileName: file.name,
          total: files.length,
        });

        results.push(await uploadContextFile(file));
        setUploadedFiles([...results]);
        setUploadProgress({
          completed: index + 1,
          current: index + 1,
          fileName: file.name,
          total: files.length,
        });
      }

    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload o indicizzazione non riusciti.",
      );
    } finally {
      if (results.length > 0) {
        await loadContextFiles();
      }

      setUploadProgress(null);
      setIsUploading(false);
    }
  }

  function handleDelete(storedName: string) {
    const file = contextFiles.find((item) => item.storedName === storedName);
    if (!file) return;

    setFileToDelete(file);
    setDeleteError(null);
  }

  function closeDeleteDialog() {
    if (deletingStoredName) return;

    setFileToDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!fileToDelete) return;

    const { storedName } = fileToDelete;

    setDeletingStoredName(storedName);
    setDeleteError(null);

    try {
      await deleteContextFile(storedName);
      setContextFiles((files) =>
        files.filter((file) => file.storedName !== storedName),
      );
      setUploadedFiles((files) =>
        files.filter((file) => file.file.storedName !== storedName),
      );
      setFileToDelete(null);
    } catch (deleteError) {
      setDeleteError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossibile eliminare il documento.",
      );
    } finally {
      setDeletingStoredName(null);
    }
  }

  return {
    contextFiles,
    closeDeleteDialog,
    confirmDelete,
    deleteError,
    deletingStoredName,
    error,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDelete,
    isDragging,
    isLoadingFiles,
    isUploading,
    fileToDelete,
    uploadProgress,
    uploadedFiles,
  };
}

export type ContextPageState = ReturnType<typeof useContextPage>;
