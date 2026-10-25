import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Booking } from '../types/api';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ bookings: Booking[] }>('/bookings/me')
      .then((res) => setBookings(res.data.bookings))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar sus reservas.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const cancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cancelar la reserva.'));
    } finally {
      setCancellingId(null);
    }
  };

  return { bookings, isLoading, error, cancel, cancellingId, reload: load };
};
