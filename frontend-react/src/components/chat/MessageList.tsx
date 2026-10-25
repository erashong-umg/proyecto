import { useEffect, useRef } from 'react';
import { formatLongDate, formatTime } from '../../services/formatters';
import { getDeliveryStatus } from '../../services/chat';
import type { ChatMessage } from '../../types/api';
import { MessageStatus } from './MessageStatus';
import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  otherUserId: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: (clientId: string) => void;
}

interface DayGroup {
  label: string;
  messages: ChatMessage[];
}

const isSameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Hoy';
  if (isSameDay(date, yesterday)) return 'Ayer';
  return formatLongDate(date);
};

const groupByDay = (messages: ChatMessage[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const message of messages) {
    const label = dayLabel(message.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }
  }
  return groups;
};

// Distancia al fondo (px) por debajo de la cual se considera que el usuario
// sigue "pegado" al final de la conversación.
const NEAR_BOTTOM_PX = 120;

export const MessageList = ({
  messages, currentUserId, otherUserId, hasMore, isLoadingMore, onLoadMore, onRetry,
}: MessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const nearBottomRef = useRef(true);

  const handleScroll = () => {
    const el = listRef.current;
    if (el) nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  // Autoscroll al fondo cuando se agrega un mensaje al final: siempre si es
  // propio, y si es del otro solo cuando el usuario ya estaba leyendo lo más
  // reciente (si subió a ver historial no se le arrebata la posición). No
  // aplica cuando se antepone historial con "Ver mensajes anteriores". La clave
  // usa clientId para que confirmar un mensaje propio no cuente como uno nuevo.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const key = lastMessage ? (lastMessage.clientId ?? lastMessage._id) : null;
    if (lastMessage && key !== lastKeyRef.current) {
      const isFirstRender = lastKeyRef.current === null;
      if (isFirstRender || lastMessage.senderId === currentUserId || nearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: isFirstRender ? 'auto' : 'smooth' });
      }
    }
    lastKeyRef.current = key;
  }, [messages, currentUserId]);

  const groups = groupByDay(messages);

  return (
    <div ref={listRef} onScroll={handleScroll} className={styles.list} role="log" aria-live="polite" aria-label="Mensajes de la conversación">
      {hasMore && (
        <div className={styles.loadMoreWrap}>
          <button
            type="button"
            className={styles.loadMore}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Cargando…' : 'Ver mensajes anteriores'}
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <p className={styles.empty}>Todavía no hay mensajes. Escriba el primero.</p>
      ) : (
        groups.map((group) => (
          <div key={`${group.label}-${group.messages[0]._id}`} className={styles.dayGroup}>
            <div className={styles.dayDivider}><span>{group.label}</span></div>
            {group.messages.map((message) => {
              const mine = message.senderId === currentUserId;
              const status = mine ? getDeliveryStatus(message, otherUserId) : null;
              return (
                <div key={message._id} className={`${styles.row} ${mine ? styles.rowMine : styles.rowTheirs}`}>
                  <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    <p className={styles.content}>{message.content}</p>
                    <div className={styles.meta}>
                      {status === 'failed' && message.clientId && (
                        <button type="button" className={styles.retry} onClick={() => onRetry?.(message.clientId!)}>
                          Reintentar
                        </button>
                      )}
                      <time className={styles.time} dateTime={message.createdAt}>
                        {formatTime(message.createdAt)}
                      </time>
                      {status && <MessageStatus status={status} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
