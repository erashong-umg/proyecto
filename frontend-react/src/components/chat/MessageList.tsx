import { useEffect, useRef } from 'react';
import { formatLongDate, formatTime } from '../../services/formatters';
import type { ChatMessage } from '../../types/api';
import styles from './MessageList.module.scss';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
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

export const MessageList = ({ messages, currentUserId, hasMore, isLoadingMore, onLoadMore }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  // Autoscroll al fondo solo cuando se agrega un mensaje nuevo al final (envío
  // propio o entrada en vivo) — no cuando se antepone historial más viejo con
  // "Ver mensajes anteriores".
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage._id !== lastIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: lastIdRef.current ? 'smooth' : 'auto' });
    }
    lastIdRef.current = lastMessage?._id ?? null;
  }, [messages]);

  const groups = groupByDay(messages);

  return (
    <div className={styles.list} role="log" aria-live="polite" aria-label="Mensajes de la conversación">
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
              return (
                <div key={message._id} className={`${styles.row} ${mine ? styles.rowMine : styles.rowTheirs}`}>
                  <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    <p className={styles.content}>{message.content}</p>
                    <time className={styles.time} dateTime={message.createdAt}>
                      {formatTime(message.createdAt)}
                    </time>
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
