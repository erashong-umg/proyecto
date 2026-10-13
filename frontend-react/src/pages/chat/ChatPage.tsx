import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareDashed } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSocketStore } from '../../store/socketStore';
import { useChatThreads } from '../../hooks/useChatThreads';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useSendMessage } from '../../hooks/useSendMessage';
import { InboxList } from '../../components/chat/InboxList';
import { MessageList } from '../../components/chat/MessageList';
import { Composer } from '../../components/chat/Composer';
import { getInitials } from '../../services/formatters';
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
  } = useChatMessages(user?._id, otherUserId);
  const { sendMessage, isSending, error: sendError } = useSendMessage(otherUserId);

  // El nombre/foto de la contraparte solo se conoce si ya existe un thread
  // con mensajes previos (GET /api/chat/threads no incluye conversaciones
  // "vacías" porque se arma agregando sobre la colección Message). Si el
  // usuario llega a /chat?with=:id desde un perfil de tutor sin haber
  // conversado todavía, mostramos un encabezado genérico hasta que el
  // primer mensaje cree el thread.
  const activeThread = threads.find((thread) => thread.otherUser._id === otherUserId);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${hasActiveThread ? styles.hiddenMobile : ''}`}>
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
                  {activeThread ? (
                    <>
                      {activeThread.otherUser.photoUrl ? (
                        <img src={activeThread.otherUser.photoUrl} alt="" className={styles.headerPhoto} />
                      ) : (
                        <span className={styles.headerAvatar}>{getInitials(activeThread.otherUser.name)}</span>
                      )}
                      <span className={styles.headerName}>{activeThread.otherUser.name}</span>
                    </>
                  ) : (
                    <span className={styles.headerName}>Conversación nueva</span>
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
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={loadMore}
                  />
                )}

                {sendError && <p className={styles.sendError} role="alert">{sendError}</p>}
                <Composer onSend={sendMessage} isSending={isSending} disabled={!isConnected} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
