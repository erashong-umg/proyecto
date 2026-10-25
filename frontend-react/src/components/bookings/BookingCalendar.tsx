import { useMemo, useState } from 'react';
import { addDays, addMonths, addWeeks, format, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  HOUR_HEIGHT, eventsOnDay, layoutDay, minutesOfDay, monthGrid, toEvents, visibleHours, weekDays,
  type CalendarEvent, type CalendarView,
} from '../../services/calendar';
import type { Booking, BookingStatus } from '../../types/api';
import styles from './BookingCalendar.module.scss';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada',
};

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const MAX_CHIPS_PER_DAY = 3;

interface BookingCalendarProps {
  bookings: Booking[];
  /** Desde qué lado se ve: define a quién se nombra en cada reserva. */
  viewer: 'student' | 'tutor';
  selectedId: string | null;
  onSelect: (bookingId: string) => void;
}

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// Agenda de reservas con vistas de día, semana y mes. Sin librerías de calendario:
// la lógica de fechas está en services/calendar.ts.
export const BookingCalendar = ({ bookings, viewer, selectedId, onSelect }: BookingCalendarProps) => {
  const [view, setView] = useState<CalendarView>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [showCancelled, setShowCancelled] = useState(false);

  const events = useMemo(() => toEvents(bookings, showCancelled), [bookings, showCancelled]);

  const move = (direction: 1 | -1) => {
    setCursor((c) => (view === 'day' ? addDays(c, direction) : view === 'week' ? addWeeks(c, direction) : addMonths(c, direction)));
  };

  const goToDay = (day: Date) => {
    setCursor(day);
    setView('day');
  };

  const title = (() => {
    if (view === 'day') return capitalize(format(cursor, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }));
    if (view === 'month') return capitalize(format(cursor, "MMMM 'de' yyyy", { locale: es }));
    const days = weekDays(cursor);
    return `${format(days[0], 'd MMM', { locale: es })} – ${format(days[6], 'd MMM yyyy', { locale: es })}`;
  })();

  const eventLabel = (e: CalendarEvent): string => {
    const other = viewer === 'student' ? e.booking.tutorId.name : e.booking.studentId.name;
    return `${e.booking.courseId.title} con ${other}, ${capitalize(format(e.start, "EEEE d 'de' MMMM", { locale: es }))}, ` +
      `de ${format(e.start, 'HH:mm')} a ${format(e.end, 'HH:mm')}, ${STATUS_LABELS[e.booking.status]}`;
  };

  const chip = (e: CalendarEvent, compact: boolean) => (
    <button
      key={e.booking._id}
      type="button"
      className={`${styles.event} ${styles[`status-${e.booking.status}`]} ${selectedId === e.booking._id ? styles.eventSelected : ''} ${compact ? styles.eventCompact : ''}`}
      onClick={() => onSelect(e.booking._id)}
      aria-label={eventLabel(e)}
      aria-pressed={selectedId === e.booking._id}
    >
      <span className={styles.eventTime}>{format(e.start, 'HH:mm')}</span>
      <span className={styles.eventTitle}>{e.booking.courseId.title}</span>
    </button>
  );

  // ---------- vistas de día y semana: cuadrícula por horas ----------
  const renderTimeGrid = (days: Date[]) => {
    const { from, to } = visibleHours(events);
    const hours = Array.from({ length: to - from }, (_, i) => from + i);
    const gridHeight = hours.length * HOUR_HEIGHT;

    return (
      <div className={styles.scroller}>
        <div className={styles.timeGrid} style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className={styles.corner} />
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              className={`${styles.dayHeader} ${isSameDay(day, new Date()) ? styles.today : ''}`}
              onClick={() => goToDay(day)}
              disabled={view === 'day'}
              aria-label={`Ver el día ${format(day, "EEEE d 'de' MMMM", { locale: es })}`}
            >
              <span>{format(day, 'EEE', { locale: es })}</span>
              <strong>{format(day, 'd')}</strong>
            </button>
          ))}

          <div className={styles.gutter} style={{ height: gridHeight }} aria-hidden="true">
            {hours.map((h) => <span key={h} style={{ height: HOUR_HEIGHT }}>{String(h).padStart(2, '0')}:00</span>)}
          </div>

          {days.map((day) => {
            const positioned = layoutDay(eventsOnDay(events, day));
            return (
              <div
                key={day.toISOString()}
                className={`${styles.dayColumn} ${isSameDay(day, new Date()) ? styles.todayColumn : ''}`}
                style={{ height: gridHeight, backgroundSize: `100% ${HOUR_HEIGHT}px` }}
              >
                {positioned.map((p) => {
                  const top = ((minutesOfDay(p.start) - from * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(((p.end.getTime() - p.start.getTime()) / 3600000) * HOUR_HEIGHT, 26);
                  return (
                    <div
                      key={p.booking._id}
                      className={styles.slot}
                      style={{ top, height, left: `${(p.col / p.cols) * 100}%`, width: `${100 / p.cols}%` }}
                    >
                      {chip(p, false)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------- vista de mes ----------
  const renderMonth = () => {
    const days = monthGrid(cursor);
    const weekdayNames = weekDays(cursor).map((d) => format(d, 'EEE', { locale: es }));
    return (
      <div className={styles.month}>
        {weekdayNames.map((name) => <div key={name} className={styles.weekday}>{name}</div>)}
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const extra = dayEvents.length - MAX_CHIPS_PER_DAY;
          return (
            <div
              key={day.toISOString()}
              className={`${styles.cell} ${isSameMonth(day, cursor) ? '' : styles.outside} ${isSameDay(day, new Date()) ? styles.todayCell : ''}`}
            >
              <button
                type="button"
                className={styles.cellNumber}
                onClick={() => goToDay(day)}
                aria-label={`Ver el día ${format(day, "EEEE d 'de' MMMM", { locale: es })}`}
              >
                {format(day, 'd')}
              </button>
              {dayEvents.slice(0, MAX_CHIPS_PER_DAY).map((e) => chip(e, true))}
              {extra > 0 && (
                <button type="button" className={styles.more} onClick={() => goToDay(day)}>
                  +{extra} más
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className={styles.calendar} aria-label="Calendario de reservas">
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <button type="button" className={styles.navButton} onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" className={styles.todayButton} onClick={() => setCursor(new Date())}>Hoy</button>
          <button type="button" className={styles.navButton} onClick={() => move(1)} aria-label="Siguiente"><ChevronRight aria-hidden="true" /></button>
        </div>

        <h2 className={styles.title} aria-live="polite">{title}</h2>

        <div className={styles.views} role="group" aria-label="Vista del calendario">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`${styles.viewButton} ${view === v.id ? styles.viewOn : ''}`}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.cancelled}>
        <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />
        Mostrar canceladas
      </label>

      {view === 'month' ? renderMonth() : renderTimeGrid(view === 'week' ? weekDays(cursor) : [cursor])}

      <ul className={styles.legend} aria-label="Leyenda de estados">
        <li><span className={`${styles.dot} ${styles['status-confirmed']}`} /> Confirmada</li>
        <li><span className={`${styles.dot} ${styles['status-completed']}`} /> Completada</li>
        {showCancelled && <li><span className={`${styles.dot} ${styles['status-cancelled']}`} /> Cancelada</li>}
      </ul>
    </section>
  );
};
