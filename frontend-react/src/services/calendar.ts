import { eachDayOfInterval, endOfMonth, endOfWeek, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Booking } from '../types/api';

// Lógica de fechas del calendario de reservas (vistas día, semana y mes). Separada
// del componente para que sea fácil de razonar y de revisar.

export type CalendarView = 'day' | 'week' | 'month';

/** Alto en px de una hora en las vistas de día y semana. */
export const HOUR_HEIGHT = 48;

/** La semana empieza en lunes. */
const WEEK = { weekStartsOn: 1 } as const;

export interface CalendarEvent {
  booking: Booking;
  start: Date;
  end: Date;
}

export const toEvents = (bookings: Booking[], showCancelled: boolean): CalendarEvent[] =>
  bookings
    .filter((b) => showCancelled || b.status !== 'cancelled')
    .map((booking) => ({ booking, start: new Date(booking.startsAt), end: new Date(booking.endsAt) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

export const eventsOnDay = (events: CalendarEvent[], day: Date): CalendarEvent[] =>
  events.filter((e) => isSameDay(e.start, day));

export const weekDays = (date: Date): Date[] =>
  eachDayOfInterval({ start: startOfWeek(date, WEEK), end: endOfWeek(date, WEEK) });

/** Las semanas completas que cubren el mes (incluye días de los meses vecinos). */
export const monthGrid = (date: Date): Date[] =>
  eachDayOfInterval({ start: startOfWeek(startOfMonth(date), WEEK), end: endOfWeek(endOfMonth(date), WEEK) });

export const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

/** Horas visibles en las vistas de día y semana: de 7 a 21 por defecto, ampliadas si hay reservas fuera. */
export const visibleHours = (events: CalendarEvent[]): { from: number; to: number } => {
  let from = 7;
  let to = 21;
  for (const e of events) {
    from = Math.min(from, e.start.getHours());
    to = Math.max(to, Math.ceil(minutesOfDay(e.end) / 60));
  }
  return { from, to: Math.min(24, to) };
};

export interface PositionedEvent extends CalendarEvent {
  /** Columna dentro del grupo de reservas que se solapan. */
  col: number;
  /** Cuántas columnas tiene ese grupo (el ancho es 1/cols). */
  cols: number;
}

/**
 * Reparte en columnas las reservas de un mismo día que se solapan en el tiempo
 * (p. ej. una cancelada y otra nueva en la misma hora), para que no se tapen.
 * Recibe las reservas ordenadas por inicio.
 */
export const layoutDay = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let clusterEnd = 0;

  const closeCluster = () => {
    const cols = Math.max(...cluster.map((c) => c.col)) + 1;
    cluster.forEach((c) => { c.cols = cols; });
    result.push(...cluster);
    cluster = [];
  };

  for (const event of dayEvents) {
    const start = event.start.getTime();
    if (cluster.length > 0 && start >= clusterEnd) closeCluster();

    const busy = cluster.filter((c) => c.end.getTime() > start).map((c) => c.col);
    let col = 0;
    while (busy.includes(col)) col++;

    cluster.push({ ...event, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, event.end.getTime());
  }
  if (cluster.length > 0) closeCluster();
  return result;
};
