import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useSocketStore } from '../store/socketStore';
import type { ChatMessage } from '../types/api';

const PAGE_SIZE = 50;

// Mismo criterio que makeThreadId en backend-express/src/sockets/chat.handler.ts:
// los dos ids ordenados alfabéticamente y unidos con "_".
const makeThreadId = (a: string, b: string): string => [a, b].sort().join('_');

/**
 * Historial de un thread (GET paginado) + mensajes en vivo vía socket.io.
 * Mantiene los mensajes siempre en orden cronológico ascendente (el REST
 * devuelve orden descendente, por eso se invierte al recibir).
 */
export const useChatMessages = (currentUserId: string | undefined, otherUserId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocketStore((state) => state.socket);

  const threadId = currentUserId && otherUserId ? makeThreadId(currentUserId, otherUserId) : undefined;

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .get<{ messages: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, { params: { limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        setMessages([...res.data.messages].reverse());
        setHasMore(res.data.messages.length === PAGE_SIZE);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'No se pudo cargar el historial de mensajes.'));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [threadId]);

  const loadMore = useCallback(() => {
    if (!threadId || isLoadingMore || messages.length === 0) return;
    const before = messages[0].createdAt;
    setIsLoadingMore(true);
    api
      .get<{ messages: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, { params: { limit: PAGE_SIZE, before } })
      .then((res) => {
        setMessages((prev) => [...[...res.data.messages].reverse(), ...prev]);
        setHasMore(res.data.messages.length === PAGE_SIZE);
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar mensajes anteriores.')))
      .finally(() => setIsLoadingMore(false));
  }, [threadId, isLoadingMore, messages]);

  // Unirse al room del thread (chat:join) mientras la conversación está
  // abierta — necesario para recibir el broadcast "chat:message" en vivo,
  // incluido el eco del propio mensaje enviado (ver chat.handler.ts).
  useEffect(() => {
    if (!socket || !otherUserId) return;
    socket.emit('chat:join', { otherUserId });
    return () => { socket.emit('chat:leave', { otherUserId }); };
  }, [socket, otherUserId]);

  useEffect(() => {
    if (!socket || !threadId) return;
    const onMessage = (incoming: ChatMessage) => {
      if (incoming.threadId !== threadId) return;
      setMessages((prev) => (prev.some((m) => m._id === incoming._id) ? prev : [...prev, incoming]));
    };
    socket.on('chat:message', onMessage);
    return () => { socket.off('chat:message', onMessage); };
  }, [socket, threadId]);

  // Marca como leídos los mensajes entrantes que el usuario actual todavía no
  // había leído (chat:read, ver chat.handler.ts) y actualiza el readBy local
  // vía el ack para no reenviar el mismo id en cada render.
  useEffect(() => {
    if (!socket || !currentUserId) return;
    const unread = messages.filter(
      (m) => m.senderId !== currentUserId && !(m.readBy ?? []).includes(currentUserId)
    );
    if (unread.length === 0) return;
    const ids = unread.map((m) => m._id);
    socket.emit('chat:read', { messageIds: ids }, (resp: { ok: boolean }) => {
      if (!resp?.ok) return;
      setMessages((prev) => prev.map((m) => (
        ids.includes(m._id) ? { ...m, readBy: [...(m.readBy ?? []), currentUserId] } : m
      )));
    });
  }, [socket, currentUserId, messages]);

  return { messages, isLoading, isLoadingMore, hasMore, error, loadMore, threadId };
};
