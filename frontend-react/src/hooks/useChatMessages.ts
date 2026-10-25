import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { createClientId } from '../services/chat';
import { useSocketStore } from '../store/socketStore';
import type { ChatMessage } from '../types/api';

const PAGE_SIZE = 50;
// Si el servidor no confirma el envío en este tiempo el mensaje queda como
// fallido (con opción de reintentar). Reenviar es seguro: el servidor
// deduplica por clientId.
const SEND_TIMEOUT_MS = 10000;

// Mismo criterio que makeThreadId en backend-express/src/sockets/chat.handler.ts:
// los dos ids ordenados alfabéticamente y unidos con "_".
const makeThreadId = (a: string, b: string): string => [a, b].sort().join('_');

const addUnique = (list: string[] | undefined, id: string): string[] =>
  list?.includes(id) ? list : [...(list ?? []), id];

/**
 * Historial de un thread (GET paginado) + mensajes en vivo vía socket.io.
 * Mantiene los mensajes siempre en orden cronológico ascendente (el REST
 * devuelve orden descendente, por eso se invierte al recibir).
 *
 * Los mensajes propios se muestran de inmediato como "pendientes" (optimista)
 * y se reemplazan por la versión confirmada cuando el servidor los retransmite
 * (se emparejan por clientId). También actualiza en vivo los checks de
 * entregado / leído y marca como leídos los mensajes entrantes.
 */
export const useChatMessages = (currentUserId: string | undefined, otherUserId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible');
  const socket = useSocketStore((state) => state.socket);
  const readRequested = useRef(new Set<string>());

  const threadId = currentUserId && otherUserId ? makeThreadId(currentUserId, otherUserId) : undefined;

  useEffect(() => {
    readRequested.current = new Set();
    if (!threadId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setMessages([]);
    setIsLoading(true);
    setError(null);
    api
      .get<{ messages: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, { params: { limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        // Se conserva lo que ya haya llegado por socket / envío mientras cargaba.
        const fetched = [...res.data.messages].reverse();
        setMessages((prev) => mergeLatest(prev, fetched));
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
    const oldest = messages.find((m) => !m.localStatus);
    if (!oldest) return;
    setIsLoadingMore(true);
    api
      .get<{ messages: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, {
        params: { limit: PAGE_SIZE, before: oldest.createdAt },
      })
      .then((res) => {
        setMessages((prev) => [...[...res.data.messages].reverse(), ...prev]);
        setHasMore(res.data.messages.length === PAGE_SIZE);
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar mensajes anteriores.')))
      .finally(() => setIsLoadingMore(false));
  }, [threadId, isLoadingMore, messages]);

  // Emite el mensaje; si no hay confirmación a tiempo o el servidor lo rechaza
  // queda marcado como fallido.
  const deliver = useCallback((clientId: string, content: string) => {
    if (!socket || !otherUserId) return;
    const markFailed = () => setMessages((prev) => prev.map((m) => (
      m.clientId === clientId && m.localStatus ? { ...m, localStatus: 'failed' } : m
    )));
    socket
      .timeout(SEND_TIMEOUT_MS)
      .emit('chat:message', { otherUserId, content, clientId }, (err: Error | null, resp?: { ok: boolean }) => {
        if (err || !resp?.ok) markFailed();
      });
  }, [socket, otherUserId]);

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !currentUserId || !threadId) return;
    const clientId = createClientId();
    const pending: ChatMessage = {
      _id: clientId,
      clientId,
      threadId,
      senderId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      deliveredTo: [],
      localStatus: 'pending',
    };
    setMessages((prev) => [...prev, pending]);
    deliver(clientId, trimmed);
  }, [currentUserId, threadId, deliver]);

  const retryMessage = useCallback((clientId: string) => {
    const failed = messages.find((m) => m.clientId === clientId && m.localStatus === 'failed');
    if (!failed) return;
    setMessages((prev) => prev.map((m) => (
      m.clientId === clientId ? { ...m, localStatus: 'pending' } : m
    )));
    deliver(clientId, failed.content);
  }, [messages, deliver]);

  // Eventos en vivo: mensajes nuevos, y checks de entregado / leído.
  useEffect(() => {
    if (!socket || !threadId) return;

    const onMessage = (incoming: ChatMessage) => {
      if (incoming.threadId !== threadId) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === incoming._id)) return prev;
        const pendingIndex = incoming.clientId ? prev.findIndex((m) => m.clientId === incoming.clientId) : -1;
        if (pendingIndex >= 0) {
          const next = [...prev];
          next[pendingIndex] = incoming;
          return next;
        }
        return [...prev, incoming];
      });
    };

    const onDelivered = (event: { threadId: string; messageIds: string[]; userId: string }) => {
      if (event.threadId !== threadId) return;
      setMessages((prev) => prev.map((m) => (
        event.messageIds.includes(m._id) ? { ...m, deliveredTo: addUnique(m.deliveredTo, event.userId) } : m
      )));
    };

    const onRead = (event: { threadId: string; messageIds: string[]; readerId: string }) => {
      if (event.threadId !== threadId) return;
      setMessages((prev) => prev.map((m) => (
        event.messageIds.includes(m._id)
          ? {
              ...m,
              readBy: addUnique(m.readBy, event.readerId),
              deliveredTo: addUnique(m.deliveredTo, event.readerId),
            }
          : m
      )));
    };

    // Al reconectar se pudieron perder mensajes / checks: se trae lo último.
    const onReconnect = () => {
      api
        .get<{ messages: ChatMessage[] }>(`/chat/threads/${threadId}/messages`, { params: { limit: PAGE_SIZE } })
        .then((res) => setMessages((prev) => mergeLatest(prev, [...res.data.messages].reverse())))
        .catch(() => { /* el próximo evento en vivo o recarga lo corrige */ });
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:delivered', onDelivered);
    socket.on('chat:read', onRead);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:delivered', onDelivered);
      socket.off('chat:read', onRead);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket, threadId]);

  // Solo se marcan como leídos los mensajes si la pestaña se está viendo,
  // igual que WhatsApp: con la pestaña en segundo plano siguen "sin leer".
  useEffect(() => {
    const onVisibility = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId || !isVisible) return;
    const ids = messages
      .filter((m) => (
        m.senderId !== currentUserId
        && !m.localStatus
        && !(m.readBy ?? []).includes(currentUserId)
        && !readRequested.current.has(m._id)
      ))
      .map((m) => m._id);
    if (ids.length === 0) return;

    ids.forEach((id) => readRequested.current.add(id));
    socket.emit('chat:read', { messageIds: ids }, (resp: { ok: boolean }) => {
      // El readBy local se actualiza con el evento "chat:read" que retransmite el servidor.
      if (!resp?.ok) ids.forEach((id) => readRequested.current.delete(id));
    });
  }, [socket, currentUserId, isVisible, messages]);

  return {
    messages, isLoading, isLoadingMore, hasMore, error, loadMore, threadId,
    sendMessage, retryMessage,
  };
};

// Combina la última página traída del servidor con lo que ya había en estado:
// conserva páginas viejas ya cargadas y mensajes locales sin confirmar.
const mergeLatest = (prev: ChatMessage[], fetched: ChatMessage[]): ChatMessage[] => {
  const fetchedIds = new Set(fetched.map((m) => m._id));
  const fetchedClientIds = new Set(fetched.map((m) => m.clientId).filter(Boolean));
  const kept = prev.filter((m) => !fetchedIds.has(m._id) && !(m.clientId && fetchedClientIds.has(m.clientId)));
  const confirmed = kept.filter((m) => !m.localStatus);
  const local = kept.filter((m) => m.localStatus);
  return [...confirmed, ...fetched, ...local];
};
