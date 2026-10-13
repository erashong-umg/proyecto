import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Formato de moneda Q (quetzal) — es-GT
export const formatQ = (amount: number): string =>
  `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Fecha en formato largo: "lunes, 5 de octubre de 2026"
export const formatLongDate = (iso: string | Date): string =>
  format(new Date(iso), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

// Fecha corta: "05/10/2026"
export const formatShortDate = (iso: string | Date): string =>
  format(new Date(iso), 'dd/MM/yyyy');

// Hora: "15:30"
export const formatTime = (iso: string | Date): string =>
  format(new Date(iso), 'HH:mm');

// Día + hora: "Lun 05/10 15:30"
export const formatDayTime = (iso: string | Date): string => {
  const d = new Date(iso);
  return `${format(d, 'EEE dd/MM HH:mm', { locale: es })}`;
};

export const dayOfWeekLabel = (dow: number): string => {
  const labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return labels[dow];
};

export const minuteToHHMM = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const getInitials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

// Tiempo relativo corto en español ("hace 5 minutos", "ayer", "hace 2 días")
// vía Intl.RelativeTimeFormat (es-GT) — usado en el inbox de chat para el
// timestamp del último mensaje de cada conversación.
const relativeTimeFormatter = new Intl.RelativeTimeFormat('es-GT', { numeric: 'auto' });

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

export const formatRelativeTime = (iso: string | Date): string => {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return relativeTimeFormatter.format(Math.round(duration), 'years');
};
