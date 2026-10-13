import { useCallback, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { TutorSummary } from '../types/api';

interface Coords {
  lat: number;
  lng: number;
}

export const useNearbySearch = () => {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback((coords: Coords, categoryId?: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    const params: Record<string, string | number> = { studentLat: coords.lat, studentLng: coords.lng };
    if (categoryId) params.categoryId = categoryId;

    api
      .get<{ tutors: TutorSummary[] }>('/tutors/search', { params })
      .then((res) => {
        const sorted = [...res.data.tutors].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        setTutors(sorted);
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los tutores.')))
      .finally(() => setIsLoading(false));
  }, []);

  return { tutors, isLoading, error, hasSearched, search };
};
