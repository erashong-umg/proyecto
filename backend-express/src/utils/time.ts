import { env } from '../config/env';

// Los horarios de los tutores ("lunes de 08:00 a 18:00") son hora local de la
// academia, no la del servidor: en Docker el servidor corre en UTC y comparar con
// getHours() desplazaba la disponibilidad 6 horas. Todo cálculo de agenda pasa
// por aquí, con la zona de APP_TIMEZONE (por defecto America/Guatemala).

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: env.APP_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short',
});

export interface ZonedParts {
  year: number;
  month: number;       // 1-12
  day: number;
  dayOfWeek: number;   // 0=Dom ... 6=Sáb
  minuteOfDay: number; // minutos desde las 00:00 locales
  second: number;
}

/** Fecha y hora de un instante, vistas en la zona de la academia. */
export const zonedParts = (date: Date): ZonedParts => {
  const p = Object.fromEntries(formatter.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    dayOfWeek: WEEKDAYS[p.weekday],
    minuteOfDay: Number(p.hour) * 60 + Number(p.minute),
    second: Number(p.second),
  };
};

/** "2026-11-09" (fecha local de la academia) de un instante. */
export const dateKeyOf = (date: Date): string => {
  const { year, month, day } = zonedParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isDateKey = (value: string): boolean => {
  const m = KEY_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
};

/** Día de la semana (0=Dom) de una fecha local "YYYY-MM-DD". */
export const dayOfWeekOfKey = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** Instante UTC que corresponde a "fecha local + minuto del día" en la zona de la academia. */
export const zonedTimeToUtc = (key: string, minuteOfDay: number): Date => {
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
  const seen = zonedParts(new Date(guess));
  const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, Math.floor(seen.minuteOfDay / 60), seen.minuteOfDay % 60);
  return new Date(guess - (seenAsUtc - guess));
};

/** 540 → "09:00". */
export const formatHHMM = (minuteOfDay: number): string =>
  `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;
