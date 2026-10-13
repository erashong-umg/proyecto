import { useCallback, useState } from 'react';
import { useSocketStore } from '../store/socketStore';

interface SendAck {
  ok: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Emite "chat:message" por socket.io (ver chat.handler.ts). No agrega el
 * mensaje de forma optimista al estado local: el backend retransmite el
 * mensaje al room del thread, incluido el eco al propio emisor, y
 * useChatMessages lo recibe por ese mismo evento — así se evita duplicarlo.
 */
export const useSendMessage = (otherUserId: string | undefined) => {
  const socket = useSocketStore((state) => state.socket);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback((content: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const trimmed = content.trim();
      if (!trimmed || !otherUserId) {
        resolve();
        return;
      }
      if (!socket?.connected) {
        const message = 'No hay conexión en tiempo real. Espere a reconectar e intente de nuevo.';
        setError(message);
        reject(new Error(message));
        return;
      }

      setIsSending(true);
      setError(null);
      socket.emit('chat:message', { otherUserId, content: trimmed }, (resp: SendAck) => {
        setIsSending(false);
        if (!resp?.ok) {
          const message = resp?.error ?? 'No se pudo enviar el mensaje.';
          setError(message);
          reject(new Error(message));
          return;
        }
        resolve();
      });
    });
  }, [socket, otherUserId]);

  return { sendMessage, isSending, error };
};
