import { useEffect, useState } from 'react';
import api from '../services/api';
import type { FreeSlot } from '../types/api';

interface SlotsState {
  key: string;
  slots: FreeSlot[];
  failed: boolean;
}

/**
 * Horas de inicio que se pueden reservar con un tutor en una fecha
 * (GET /api/availability/:tutorId/slots). El backend ya descuenta las tutorías
 * del tutor y del estudiante, y — si es una suscripción — todas las semanas.
 */
export const useFreeSlots = (
  tutorId: string,
  date: string,
  durationMin: number,
  repeatWeeks: number
) => {
  const [state, setState] = useState<SlotsState | null>(null);

  const key = date ? `${tutorId}|${date}|${durationMin}|${repeatWeeks}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api
      .get<{ slots: FreeSlot[] }>(`/availability/${tutorId}/slots`, { params: { date, durationMin, repeatWeeks } })
      .then((res) => { if (!cancelled) setState({ key, slots: res.data.slots, failed: false }); })
      .catch(() => { if (!cancelled) setState({ key, slots: [], failed: true }); });
    return () => { cancelled = true; };
    // `key` resume tutorId/date/durationMin/repeatWeeks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // El resultado guardado solo vale si corresponde a la selección actual.
  const current = state && state.key === key ? state : null;
  return {
    slots: current?.slots ?? [],
    isLoading: key !== null && current === null,
    failed: current?.failed ?? false,
  };
};
