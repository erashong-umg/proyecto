import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Availability } from '../types/api';

export const useAvailability = (tutorId: string | undefined) => {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;
    let cancelled = false;
    api
      .get<{ availability: Availability }>(`/availability/${tutorId}`)
      .then((res) => {
        if (!cancelled) setAvailability(res.data.availability);
      })
      .catch(() => {
        if (!cancelled) setAvailability({ slots: [] });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [tutorId]);

  return { availability, isLoading };
};
