import { useCallback, useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { TimeSlot } from '../types/api';

export const DAYS = [0, 1, 2, 3, 4, 5, 6];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 a 21:00 (bloques de 1h, hasta 22:00)

export const cellKey = (day: number, hour: number): string => `${day}_${hour}`;

/** Expande slots {dayOfWeek, startMinute, endMinute} a celdas de 1h que caen completas dentro del slot. */
export const slotsToCells = (slots: TimeSlot[]): Set<string> => {
  const cells = new Set<string>();
  for (const slot of slots) {
    for (const hour of HOURS) {
      const start = hour * 60;
      const end = start + 60;
      if (slot.startMinute <= start && slot.endMinute >= end) {
        cells.add(cellKey(slot.dayOfWeek, hour));
      }
    }
  }
  return cells;
};

/** Fusiona celdas de horas contiguas del mismo día en slots {dayOfWeek, startMinute, endMinute}. */
export const cellsToSlots = (cells: Set<string>): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (const day of DAYS) {
    const hoursForDay = HOURS.filter((h) => cells.has(cellKey(day, h))).sort((a, b) => a - b);
    let runStart: number | null = null;
    let prev: number | null = null;
    for (const h of hoursForDay) {
      if (runStart === null) {
        runStart = h;
        prev = h;
        continue;
      }
      if (h === prev! + 1) {
        prev = h;
        continue;
      }
      slots.push({ dayOfWeek: day, startMinute: runStart * 60, endMinute: (prev! + 1) * 60 });
      runStart = h;
      prev = h;
    }
    if (runStart !== null) {
      slots.push({ dayOfWeek: day, startMinute: runStart * 60, endMinute: (prev! + 1) * 60 });
    }
  }
  return slots;
};

const sameCells = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((k) => b.has(k));

export const useMyAvailability = () => {
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [initialCells, setInitialCells] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const paintValue = useRef<boolean | null>(null);

  useEffect(() => {
    api
      .get<{ availability: { slots: TimeSlot[] } }>('/availability/me')
      .then((res) => {
        const loaded = slotsToCells(res.data.availability.slots ?? []);
        setCells(loaded);
        setInitialCells(loaded);
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar su disponibilidad.')))
      .finally(() => setIsLoading(false));
  }, []);

  const isSelected = useCallback((day: number, hour: number) => cells.has(cellKey(day, hour)), [cells]);

  const toggleCell = useCallback((day: number, hour: number) => {
    setCells((prev) => {
      const next = new Set(prev);
      const key = cellKey(day, hour);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /** Inicia el arrastre: alterna la celda inicial y recuerda ese valor para pintar el resto. */
  const beginPaint = useCallback((day: number, hour: number) => {
    const key = cellKey(day, hour);
    setCells((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(key);
      if (willSelect) next.add(key);
      else next.delete(key);
      paintValue.current = willSelect;
      return next;
    });
  }, []);

  /** Pinta una celda adicional durante el arrastre con el mismo valor de la celda inicial. */
  const paintCell = useCallback((day: number, hour: number) => {
    if (paintValue.current === null) return;
    setCells((prev) => {
      const key = cellKey(day, hour);
      const has = prev.has(key);
      if (has === paintValue.current) return prev;
      const next = new Set(prev);
      if (paintValue.current) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const endPaint = useCallback(() => {
    paintValue.current = null;
  }, []);

  const hasChanges = !sameCells(cells, initialCells);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await api.put('/availability/me', { slots: cellsToSlots(cells) });
      setInitialCells(new Set(cells));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar su disponibilidad.'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading, isSaving, error, success, hasChanges,
    isSelected, toggleCell, beginPaint, paintCell, endPaint, save,
  };
};
