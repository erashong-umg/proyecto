import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useSocketStore } from '../store/socketStore';
import type { ChatThread } from '../types/api';

// Intervalo de respaldo para refrescar el inbox. El backend solo retransmite
// "chat:message" a los sockets que se unieron al room del thread (chat:join,
// ver chat.handler.ts) — un socket que está mirando el inbox pero no tiene
// abierto NINGÚN thread no recibe push en tiempo real para threads ajenos al
// que está activo. Este polling corto es el respaldo para que el inbox no
// quede desactualizado mientras se está viendo.
const REFRESH_INTERVAL_MS = 15000;

export const useChatThreads = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocketStore((state) => state.socket);

  const reload = useCallback(() => {
    setError(null);
    api
      .get<{ threads: ChatThread[] }>('/chat/threads')
      .then((res) => setThreads(res.data.threads))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar sus conversaciones.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Si el thread actualmente abierto recibe un mensaje nuevo (propio o del
  // otro participante), refrescamos el inbox para que el último mensaje y el
  // contador de no leídos queden al día.
  useEffect(() => {
    if (!socket) return;
    socket.on('chat:message', reload);
    return () => { socket.off('chat:message', reload); };
  }, [socket, reload]);

  useEffect(() => {
    const interval = setInterval(reload, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return { threads, isLoading, error, reload };
};
