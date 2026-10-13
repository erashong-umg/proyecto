import { ClipboardX } from 'lucide-react';
import { useBookings } from '../../hooks';
import { BookingCard } from '../../components/bookings/BookingCard';
import styles from './Bookings.module.scss';

export const TutorBookingsPage = () => {
  const { bookings, isLoading, error, cancel, cancellingId, complete, completingId } = useBookings();

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
        <div className={styles.list}>
          {bookings.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              counterpartLabel={`Estudiante: ${b.studentId.name}`}
              onCancel={() => cancel(b._id)}
              isCancelling={cancellingId === b._id}
              onComplete={() => complete(b._id)}
              isCompleting={completingId === b._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
