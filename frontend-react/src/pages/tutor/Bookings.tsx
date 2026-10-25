import { ClipboardX } from 'lucide-react';
import { useBookings } from '../../hooks';
import { BookingsAgenda } from '../../components/bookings/BookingsAgenda';
import styles from './Bookings.module.scss';

export const TutorBookingsPage = () => {
  const { bookings, isLoading, error, cancel, cancellingId, reload } = useBookings();

  return (
    <div className={`${styles.page} container`}>
      <h1>Reservas recibidas</h1>
      <p className={styles.subtitle}>Las tutorías que sus estudiantes le agendaron.</p>

      {error && <p className={styles.error}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : bookings.length === 0 ? (
        <div className={styles.empty}>
          <ClipboardX aria-hidden="true" />
          <p>Todavía no tiene reservas.</p>
        </div>
      ) : (
        <BookingsAgenda
          listClassName={styles.list}
          bookings={bookings}
          viewer="tutor"
          onCancel={cancel}
          cancellingId={cancellingId}
          onReviewed={reload}
        />
      )}
    </div>
  );
};
