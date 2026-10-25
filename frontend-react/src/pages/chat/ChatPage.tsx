import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareDashed } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSocketStore } from '../../store/socketStore';
import { useChatThreads } from '../../hooks/useChatThreads';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useChatPeer } from '../../hooks/useChatPeer';
import { InboxList } from '../../components/chat/InboxList';
import { MessageList } from '../../components/chat/MessageList';
import { Composer } from '../../components/chat/Composer';
import { formatLastSeen, getInitials } from '../../services/formatters';
import styles from './ChatPage.module.scss';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const otherUserId = searchParams.get('with') ?? undefined;
  const hasActiveThread = Boolean(otherUserId);

  const { user } = useAuth();
  const currentUserId = user?._id ?? '';
  const isConnected = useSocketStore((state) => state.isConnected);

  const { threads, isLoading: threadsLoading, error: threadsError } = useChatThreads();
  const {
    messages,
    isLoading: messagesLoading,
    isLoadingMore,
    hasMore,
    error: messagesError,
    loadMore,
    sendMessage,
    retryMessage,
  } = useChatMessages(user?._id, otherUserId);
  const { contact, presence, isTyping, notifyTyping } = useChatPeer(otherUserId);

  // El contacto sale de chat:join (funciona también en una conversación nueva,
  // sin mensajes previos); el inbox sirve de respaldo mientras ese ack llega.
  const activeThread = threads.find((thread) => thread.otherUser._id === otherUserId);
  const peer = contact ?? activeThread?.otherUser ?? null;

  let peerStatus: string | null = null;
  if (isTyping) peerStatus = 'escribiendo…';
  else if (presence?.online) peerStatus = 'en línea';
  else if (presence?.lastSeenAt) peerStatus = formatLastSeen(presence.lastSeenAt);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${hasActiveThread ? styles.hiddenMobile : ''}`} data-tour="chat-bandeja">
            <h1 className={styles.sidebarTitle}>Mensajes</h1>
            {threadsLoading ? (
              <p className={styles.status}>Cargando conversaciones…</p>
            ) : threadsError ? (
              <p className={styles.status}>{threadsError}</p>
            ) : (
              <InboxList threads={threads} activeOtherUserId={otherUserId} currentUserId={currentUserId} />
            )}
          </aside>

          <section className={`${styles.main} ${!hasActiveThread ? styles.hiddenMobile : ''}`} aria-label="Conversación">
            {!isConnected && (
              <div className={styles.connectingBanner} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Conectando…
              </div>
            )}

            {!hasActiveThread ? (
              <div className={styles.placeholder}>
                <MessageSquareDashed aria-hidden="true" />
                <p>Seleccione una conversación para ver los mensajes.</p>
              </div>
            ) : (
              <div className={styles.conversation}>
                <div className={styles.conversationHeader}>
                  <Link to="/chat" className={styles.backLink} aria-label="Volver a mensajes">
                    <ArrowLeft aria-hidden="true" />
                  </Link>
                  {peer ? (
                    <>
                      {peer.photoUrl ? (
                        <img src={peer.photoUrl} alt="" className={styles.headerPhoto} />
                      ) : (
                        <span className={styles.headerAvatar}>{getInitials(peer.name)}</span>
                      )}
                      <div className={styles.headerInfo}>
                        <span className={styles.headerName}>{peer.name}</span>
                        {peerStatus && (
                          <span
                            className={`${styles.headerStatus} ${isTyping || presence?.online ? styles.headerStatusLive : ''}`}
                            aria-live="polite"
                          >
                            {peerStatus}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className={styles.headerName}>Conversación</span>
                  )}
                </div>

                {messagesLoading ? (
                  <p className={styles.status}>Cargando mensajes…</p>
                ) : messagesError ? (
                  <p className={styles.status}>{messagesError}</p>
                ) : (
                  <MessageList
                    messages={messages}
                    currentUserId={currentUserId}
                    otherUserId={otherUserId!}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                    onRetry={retryMessage}
                  />
                )}

                <div data-tour="chat-redactor"><Composer onSend={sendMessage} onTyping={notifyTyping} /></div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
