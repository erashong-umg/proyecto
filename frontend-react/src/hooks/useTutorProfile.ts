import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { TutorProfile } from '../types/api';

export const useTutorProfile = (tutorId: string | undefined) => {
  const [data, setData] = useState<TutorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .get<TutorProfile>(`/tutors/${tutorId}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'No se pudo cargar el perfil del tutor.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [tutorId]);

  return { data, isLoading, error };
};
