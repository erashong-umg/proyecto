import { useState } from 'react';
import { CalendarDays, List } from 'lucide-react';
import { BookingCalendar } from './BookingCalendar';
import { BookingList } from './BookingList';
import type { Booking } from '../../types/api';
import styles from './BookingsAgenda.module.scss';

type Mode = 'lista' | 'calendario';

const STORAGE_KEY = 'educaspot_agenda_vista';

const readMode = (): Mode => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'calendario' ? 'calendario' : 'lista';
  } catch {
    return 'lista';
  }
};

interface BookingsAgendaProps {
  bookings: Booking[];
  viewer: 'student' | 'tutor';
  onCancel: (bookingId: string) => void;
  cancellingId: string | null;
  onReviewed: () => void;
  listClassName?: string;
}

// Las reservas en dos vistas: la lista de siempre o un calendario (día, semana y mes).
// En el calendario, al elegir una reserva aparece debajo su tarjeta con las mismas
// acciones que en la lista (cancelar, calificar, reportar). Se recuerda la vista elegida.
export const BookingsAgenda = ({ bookings, viewer, onCancel, cancellingId, onReviewed, listClassName }: BookingsAgendaProps) => {
  const [mode, setMode] = useState<Mode>(readMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const changeMode = (next: Mode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin localStorage: la vista simplemente no se recuerda.
    }
  };

  const selected = bookings.find((b) => b._id === selectedId);

  return (
    <div>
      <div className={styles.modes} role="group" aria-label="Forma de ver las reservas">
        <button type="button" className={`${styles.mode} ${mode === 'lista' ? styles.modeOn : ''}`} aria-pressed={mode === 'lista'} onClick={() => changeMode('lista')}>
          <List aria-hidden="true" /> Lista
        </button>
        <button type="button" className={`${styles.mode} ${mode === 'calendario' ? styles.modeOn : ''}`} aria-pressed={mode === 'calendario'} onClick={() => changeMode('calendario')}>
          <CalendarDays aria-hidden="true" /> Calendario
        </button>
      </div>

      {mode === 'lista' ? (
        <BookingList
          className={listClassName}
          bookings={bookings}
          viewer={viewer}
          onCancel={onCancel}
          cancellingId={cancellingId}
          onReviewed={onReviewed}
        />
      ) : (
        <>
          <BookingCalendar bookings={bookings} viewer={viewer} selectedId={selectedId} onSelect={setSelectedId} />
          <div className={styles.selected} aria-live="polite">
            {selected ? (
              <BookingList
                className={listClassName}
                bookings={[selected]}
                viewer={viewer}
                onCancel={onCancel}
                cancellingId={cancellingId}
                onReviewed={onReviewed}
              />
            ) : (
              <p className={styles.hint}>Elija una reserva en el calendario para ver su detalle y sus acciones.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
