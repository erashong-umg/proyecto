import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/socketStore';
import type { ChatContact, ChatMessage, ChatPresence } from '../types/api';

// Mientras se sigue escribiendo se re-emite "escribiendo" como mucho cada
// TYPING_THROTTLE_MS; si se deja de teclear, se avisa el fin tras TYPING_IDLE_MS.
const TYPING_THROTTLE_MS = 2500;
const TYPING_IDLE_MS = 3000;
// Respaldo por si el aviso de "dejó de escribir" nunca llega (p.ej. se cayó su conexión).
const TYPING_EXPIRE_MS = 6000;

interface JoinAck {
  ok: boolean;
  contact?: ChatContact;
  presence?: ChatPresence;
}

/**
 * Todo lo "vivo" del otro participante de la conversación abierta: datos del
 * contacto, si está en línea / su última vez, y si está escribiendo. También
 * expone `notifyTyping` para avisarle a él cuando el usuario actual escribe.
 */
export const useChatPeer = (otherUserId: string | undefined) => {
  const socket = useSocketStore((state) => state.socket);
  const [contact, setContact] = useState<ChatContact | null>(null);
  const [presence, setPresence] = useState<ChatPresence | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const expireTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingEmit = useRef(0);

  // chat:join devuelve contacto + presencia y suscribe a sus cambios. Las rooms
  // se pierden al reconectar, por eso se repite en cada 'connect'.
  useEffect(() => {
    setContact(null);
    setPresence(null);
    setIsTyping(false);
    if (!socket || !otherUserId) return;

    let cancelled = false;
    const join = () => {
      socket.emit('chat:join', { otherUserId }, (resp: JoinAck) => {
        if (cancelled || !resp?.ok) return;
        if (resp.contact) setContact(resp.contact);
        if (resp.presence) setPresence(resp.presence);
      });
    };
    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      cancelled = true;
      socket.off('connect', join);
      if (socket.connected) socket.emit('chat:leave', { otherUserId });
    };
  }, [socket, otherUserId]);

  useEffect(() => {
    if (!socket || !otherUserId) return;

    const onPresence = (update: { userId: string; online: boolean; lastSeenAt?: string }) => {
      if (update.userId !== otherUserId) return;
      setPresence((prev) => ({ online: update.online, lastSeenAt: update.lastSeenAt ?? prev?.lastSeenAt ?? null }));
      if (!update.online) setIsTyping(false);
    };

    const onTyping = (event: { userId: string; isTyping: boolean }) => {
      if (event.userId !== otherUserId) return;
      clearTimeout(expireTimer.current);
      setIsTyping(event.isTyping);
      if (event.isTyping) {
        expireTimer.current = setTimeout(() => setIsTyping(false), TYPING_EXPIRE_MS);
      }
    };

    // Un mensaje suyo implica que ya dejó de escribir.
    const onMessage = (message: ChatMessage) => {
      if (message.senderId === otherUserId) setIsTyping(false);
    };

    socket.on('presence:update', onPresence);
    socket.on('chat:typing', onTyping);
    socket.on('chat:message', onMessage);
    return () => {
      socket.off('presence:update', onPresence);
      socket.off('chat:typing', onTyping);
      socket.off('chat:message', onMessage);
      clearTimeout(expireTimer.current);
    };
  }, [socket, otherUserId]);

  const notifyTyping = useCallback((typing: boolean) => {
    if (!socket?.connected || !otherUserId) return;
    clearTimeout(idleTimer.current);

    if (!typing) {
      if (lastTypingEmit.current) socket.emit('chat:typing', { otherUserId, isTyping: false });
      lastTypingEmit.current = 0;
      return;
    }

    const now = Date.now();
    if (now - lastTypingEmit.current > TYPING_THROTTLE_MS) {
      socket.emit('chat:typing', { otherUserId, isTyping: true });
      lastTypingEmit.current = now;
    }
    idleTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { otherUserId, isTyping: false });
      lastTypingEmit.current = 0;
    }, TYPING_IDLE_MS);
  }, [socket, otherUserId]);

  // Al cambiar de conversación o salir, no dejar el "escribiendo…" colgado.
  useEffect(() => () => notifyTyping(false), [notifyTyping]);

  return { contact, presence, isTyping, notifyTyping };
};
