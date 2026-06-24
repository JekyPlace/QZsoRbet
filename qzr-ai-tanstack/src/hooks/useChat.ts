import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl, getChats, streamChatMessage } from "#/services/network";
import type { Chat } from "#/types/api.types";

const chatKeys = {
  all: ["chats"] as const,
  detail: (chatId: string) => ["chat", chatId] as const,
};

async function getChatById(chatId: string): Promise<Chat> {
  const response = await fetch(apiUrl(`/chat/${chatId}`));

  if (!response.ok) {
    throw new Error(`Errore nel caricamento della chat: ${response.status}`);
  }

  return response.json();
}

export async function deleteChatById(chatId: string): Promise<void> {
  if (!chatId) throw new Error("Chat inesistente!");

  const response = await fetch(apiUrl(`/chat/${chatId}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Problemi con l'eliminazione della chat");
  }
}

export default function useChat(chatId?: string, selectedModel?: string) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");

  const chatsQuery = useQuery<Chat[]>({
    queryKey: chatKeys.all,
    queryFn: getChats,
  });

  const chatQuery = useQuery<Chat>({
    queryKey: chatKeys.detail(chatId ?? ""),
    queryFn: () => getChatById(chatId!),
    enabled: Boolean(chatId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!chatId) throw new Error("Chat non selezionata");
      if (!content) throw new Error("Il messaggio non può essere vuoto");

      return streamChatMessage(
        { chatId, content, model: selectedModel || undefined },
        (chunk) => {
          setStreamingMessage((current) => current + chunk);
        },
      );
    },
    onMutate: () => {
      const sentMessage = message.trim();
      setMessage("");
      setPendingMessage(sentMessage);
      setStreamingMessage("");

      return { sentMessage };
    },
    onSuccess: (updatedChat) => {
      queryClient.setQueryData(chatKeys.detail(updatedChat.id), updatedChat);
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      setPendingMessage("");
      setStreamingMessage("");
    },
    onError: (_error, _content, context) => {
      setMessage(context?.sentMessage ?? "");
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChatById,
    onSuccess: (_data, deletedChatId) => {
      queryClient.removeQueries({ queryKey: chatKeys.detail(deletedChatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });

  const sendMessage = () => {
    const content = message.trim();
    if (!content) return;

    sendMessageMutation.mutate(content);
  };

  const deleteChat = (chatIdToDelete: string) =>
    deleteChatMutation.mutateAsync(chatIdToDelete);

  return {
    chats: chatsQuery.data ?? [],
    chat: chatQuery.data ?? null,
    error: chatsQuery.error?.message ?? chatQuery.error?.message ?? null,
    isLoading: chatsQuery.isLoading || chatQuery.isLoading,
    refetch: chatsQuery.refetch,
    chatError: chatQuery.error?.message ?? null,
    isChatLoading: chatQuery.isPending,
    isChatFetching: chatQuery.isFetching,
    refetchChat: chatQuery.refetch,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error?.message ?? null,
    message,
    setMessage,
    pendingMessage,
    streamingMessage,
    deleteChat,
    isDeleting: deleteChatMutation.isPending,
    deleteError: deleteChatMutation.error?.message ?? null,
    clearDeleteError: deleteChatMutation.reset,
  };
}
