import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

export interface PendingTutor {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  createdAt: string;
  tutorData: {
    bio: string;
    baseRate: number;
    ratePerKm: number;
    categories: string[];
    approved: boolean;
  };
}

// Tutores pendientes de aprobación para el panel admin. El listado y la
// aprobación usan endpoints reales montados en
// backend-express/src/routes/admin.routes.ts:
//   GET   /api/admin/tutors/pending
//   PATCH /api/admin/tutors/:id/approve
//
// No existe un endpoint dedicado para "rechazar" una solicitud de tutor
// pendiente (no hay DELETE ni PATCH .../reject en admin.routes.ts). Como
// medida pragmática — sin inventar una ruta nueva en el backend — `reject`
// reutiliza el endpoint real de suspensión de cuenta
// (PATCH /api/admin/users/:id/suspend), que ya exige un motivo y encaja con
// la UX de "rechazar con justificación". Esto deja la cuenta en status
// 'suspended' en vez de un estado "rechazado" propio; si se necesita
// distinguir ambos casos en reportes/analítica más adelante, hace falta
// agregar un endpoint de rechazo específico en el backend.
export const useAdminTutors = () => {
  const [tutors, setTutors] = useState<PendingTutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ tutors: PendingTutor[] }>('/admin/tutors/pending')
      .then((res) => setTutors(res.data.tutors))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la lista de tutores pendientes.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (tutorId: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/tutors/${tutorId}/approve`);
      setTutors((prev) => prev.filter((t) => t._id !== tutorId));
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo aprobar al tutor.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reject = async (tutorId: string, reason: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/users/${tutorId}/suspend`, { reason });
      setTutors((prev) => prev.filter((t) => t._id !== tutorId));
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo rechazar al tutor.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { tutors, isLoading, isSaving, error, approve, reject, reload: load };
};
