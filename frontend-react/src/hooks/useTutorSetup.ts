import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Availability, Booking, Course } from '../types/api';

interface TutorSetup {
  isLoading: boolean;
  /** Publicó al menos un horario semanal. */
  hasAvailability: boolean;
  /** Cursos activos. */
  courseCount: number;
  /** Tutorías confirmadas que todavía no empiezan. */
  upcomingCount: number;
}

const EMPTY: TutorSetup = { isLoading: true, hasAvailability: false, courseCount: 0, upcomingCount: 0 };

/**
 * Lo que el panel del tutor necesita para decir qué paso falta: horarios
 * publicados, cursos activos y próximas tutorías. Si algo falla, se asume
 * "no hecho" (el panel sigue siendo usable).
 */
export const useTutorSetup = (): TutorSetup => {
  const [state, setState] = useState<TutorSetup>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const safe = <T,>(promise: Promise<{ data: T }>): Promise<T | null> =>
      promise.then((res) => res.data).catch(() => null);

    Promise.all([
      safe(api.get<{ availability: Availability }>('/availability/me')),
      safe(api.get<{ courses: Course[] }>('/courses/me/list')),
      safe(api.get<{ bookings: Booking[] }>('/bookings/me')),
    ]).then(([availability, courses, bookings]) => {
      if (cancelled) return;
      const now = Date.now();
      setState({
        isLoading: false,
        hasAvailability: (availability?.availability.slots.length ?? 0) > 0,
        courseCount: courses?.courses.filter((c) => c.active).length ?? 0,
        upcomingCount: bookings?.bookings.filter(
          (b) => b.status === 'confirmed' && new Date(b.startsAt).getTime() > now
        ).length ?? 0,
      });
    });

    return () => { cancelled = true; };
  }, []);

  return state;
};
