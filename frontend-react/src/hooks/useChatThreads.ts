import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useSocketStore } from '../store/socketStore';
import type { ChatThread } from '../types/api';

// Varios eventos seguidos (mensajes, checks) se agrupan en una sola recarga.
const RELOAD_DEBOUNCE_MS = 300;

// Eventos del socket que cambian lo que muestra el inbox: último mensaje,
// contador de no leídos y checks del último mensaje propio.
const INBOX_EVENTS = ['chat:message', 'chat:read', 'chat:delivered'] as const;

export const useChatThreads = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocketStore((state) => state.socket);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reload = useCallback(() => {
    setError(null);
    api
      .get<{ threads: ChatThread[] }>('/chat/threads')
      .then((res) => setThreads(res.data.threads))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar sus conversaciones.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Cada usuario recibe los mensajes en su room personal (user:<id>), así que
  // el inbox se entera en vivo de cualquier conversación, esté abierta o no.
  // Al reconectar se recarga por si se perdió algo mientras estaba caído.
  useEffect(() => {
    if (!socket) return;
    const scheduleReload = () => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(reload, RELOAD_DEBOUNCE_MS);
    };
    INBOX_EVENTS.forEach((event) => socket.on(event, scheduleReload));
    socket.io.on('reconnect', reload);
    return () => {
      INBOX_EVENTS.forEach((event) => socket.off(event, scheduleReload));
      socket.io.off('reconnect', reload);
      clearTimeout(debounceTimer.current);
    };
  }, [socket, reload]);

  return { threads, isLoading, error, reload };
};
