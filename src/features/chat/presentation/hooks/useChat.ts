import { useAuthStore } from "@features/auth/presentation/store/authStore";
import { GetMessagesUseCase } from "@features/chat/application/use-cases/GetMessagesUseCase";
import { SendMessageUseCase } from "@features/chat/application/use-cases/SendMessageUseCase";
import { SubscribeToRoomUseCase } from "@features/chat/application/use-cases/SubscribeToRoomUseCase";
import { Message } from "@features/chat/domain/entities/Message";
import { SendMessageInput } from "@features/chat/domain/repositories/IChatRepository";
import { SupabaseChatRepository } from "@features/chat/infrastructure/repositories/SupabaseChatRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const chatRepo = new SupabaseChatRepository();
const sendMessageUseCase = new SendMessageUseCase(chatRepo);
const getMessagesUseCase = new GetMessagesUseCase(chatRepo);
const subscribeUseCase = new SubscribeToRoomUseCase(chatRepo);

export function useChat(roomId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Paso 1: obtener historial de mensajes con cache
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", roomId], // Clave única por sala
    queryFn: () => getMessagesUseCase.execute(roomId),
    enabled: !!user,
    // Los mensajes antiguos no se revalidan automáticamente.
    // Realtime se encarga de los mensajes nuevos.
    staleTime: Infinity,
  });

  // Paso 2: suscribirse al canal Realtime
  useEffect(() => {
    const unsubscribe = subscribeUseCase.execute(roomId, (newMsg) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        // Evitar duplicados: el optimistic update ya agregó este mensaje
        const exists = old.some((m) => m.id === newMsg.id);
        return exists ? old : [...old, newMsg];
      });
    });
    return unsubscribe; // Cleanup al desmontar: cierra el WebSocket
  }, [roomId]);

  // Paso 3: enviar mensaje con optimistic update via useMutation
  const sendMutation = useMutation({
    mutationFn: (input: SendMessageInput) =>
      sendMessageUseCase.execute(roomId, user!.id, input),

    // onMutate se ejecuta ANTES de la petición (optimistic update)
    onMutate: async (input) => {
      const trimmedContent = input.content?.trim() ?? "";
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        roomId,
        userId: user!.id,
        content: trimmedContent,
        imageUrl: input.imageUri ?? null,
        localImageUri: input.imageUri ?? null,
        sending: true,
        failed: false,
        createdAt: new Date(),
        authorUsername: user!.username,
      };
      console.log('[useChat] onMutate tempMsg', tempMsg);
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => [
        ...old,
        tempMsg,
      ]);
      return { tempMsg }; // Contexto para onError
    },

    onSuccess: (realMsg, _content, context) => {
      console.log('[useChat] onSuccess realMsg', realMsg, 'context', context);
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
        old.map((m) => (m.id === context?.tempMsg.id ? realMsg : m)),
      );
    },

    onError: (_err, _content, context) => {
      console.error('[useChat] onError', _err, 'context', context);
      if (context?.tempMsg) {
        // Mark the temp message as failed instead of removing it
        queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
          old.map((m) =>
            m.id === context.tempMsg.id ? { ...m, failed: true, sending: false } : m,
          ),
        );
      }
    },
  });

  const retrySend = (tempId: string) => {
    const msgs: Message[] = queryClient.getQueryData(["messages", roomId]) ?? [];
    const temp = msgs.find((m) => m.id === tempId);
    if (!temp) return;
    // Remove the failed temp before retry to avoid duplicates
    queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => old.filter((m) => m.id !== tempId));
    // Retry using original content and localImageUri
    sendMutation.mutate({ content: temp.content, imageUri: (temp as any).localImageUri ?? null });
  };

  return {
    messages,
    sendMessage: sendMutation.mutate,
    retrySend,
    isLoading,
    isSending: sendMutation.isPending,
  };
}
