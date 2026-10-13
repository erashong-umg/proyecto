import { Link } from 'react-router-dom';
import { getInitials, formatRelativeTime } from '../../services/formatters';
import type { ChatThread } from '../../types/api';
import styles from './InboxList.module.scss';

interface InboxListProps {
  threads: ChatThread[];
  activeOtherUserId?: string;
  currentUserId: string;
}

export const InboxList = ({ threads, activeOtherUserId, currentUserId }: InboxListProps) => {
  if (threads.length === 0) {
    return (
      <p className={styles.empty}>
        Todavía no tiene conversaciones. Escríbale a un tutor o estudiante desde su perfil o una reserva.
      </p>
    );
  }

  return (
    <ul className={styles.list} aria-label="Lista de conversaciones">
      {threads.map((thread) => {
        const isActive = thread.otherUser._id === activeOtherUserId;
        const isMine = thread.lastMessage.senderId === currentUserId;

        return (
          <li key={thread.threadId}>
            <Link
              to={`/chat?with=${thread.otherUser._id}`}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {thread.otherUser.photoUrl ? (
                <img src={thread.otherUser.photoUrl} alt="" className={styles.photo} />
              ) : (
                <span className={styles.avatar}>{getInitials(thread.otherUser.name)}</span>
              )}

              <div className={styles.info}>
                <div className={styles.topRow}>
                  <span className={styles.name}>{thread.otherUser.name}</span>
                  <span className={styles.time}>{formatRelativeTime(thread.lastMessage.createdAt)}</span>
                </div>
                <div className={styles.bottomRow}>
                  <span className={styles.preview}>
                    {isMine ? 'Usted: ' : ''}{thread.lastMessage.content}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className={styles.badge} aria-label={`${thread.unreadCount} mensajes sin leer`}>
                      {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
