import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { UserRole, UserStatus } from '../types/user';

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

// Listado y gestión de cuentas para el panel admin. Los tres endpoints son
// reales, montados en backend-express/src/routes/admin.routes.ts:
//   GET   /api/admin/users?role=&status=   (máx. 100 resultados, el backend
//         los pagina con .limit(100) — la paginación visible en la UI es
//         client-side sobre ese arreglo ya acotado)
//   PATCH /api/admin/users/:id/suspend     body: { reason: string }
//   PATCH /api/admin/users/:id/reactivate
// El backend ya rechaza que un admin se suspenda a sí mismo; la UI además
// deshabilita el botón client-side (ver Users.tsx) para no depender solo del
// 400 del servidor.
export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    api
      .get<{ users: AdminUser[] }>('/admin/users', { params })
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar la lista de usuarios.')))
      .finally(() => setIsLoading(false));
  }, [roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const suspend = async (userId: string, reason: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/users/${userId}/suspend`, { reason });
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo suspender al usuario.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reactivate = async (userId: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/users/${userId}/reactivate`);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo reactivar al usuario.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    users,
    isLoading,
    isSaving,
    error,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    suspend,
    reactivate,
    reload: load,
  };
};
