import { Link } from 'react-router-dom';
import { CalendarX2 } from 'lucide-react';
import { useBookings } from '../../hooks/useBookings';
import { Button } from '../../components/ui/Button';
import { BookingCard } from '../../components/bookings/BookingCard';
import styles from './MyBookings.module.scss';

export const MyBookingsPage = () => {
  const { bookings, isLoading, error, cancel, cancellingId } = useBookings();

  return (
    <div className={styles.page}>
      <div className="container">
        <h1>Mis reservas</h1>
        <p className={styles.subtitle}>Sus tutorías reservadas, pasadas y futuras.</p>

        {error && <p className={styles.error}>{error}</p>}

        {isLoading ? (
          <p className={styles.status}>Cargando…</p>
        ) : bookings.length === 0 ? (
          <div className={styles.empty}>
            <CalendarX2 aria-hidden="true" />
            <p>Todavía no tiene reservas.</p>
            <Link to="/tutores"><Button size="sm">Buscar tutores</Button></Link>
          </div>
        ) : (
          <div className={styles.list}>
            {bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                counterpartLabel={`con ${b.tutorId.name}`}
                onCancel={() => cancel(b._id)}
                isCancelling={cancellingId === b._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
