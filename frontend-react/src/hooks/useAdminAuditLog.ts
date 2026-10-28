import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

export interface AuditLogEntry {
  _id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
  createdAt: string;
}

// GET /api/admin/audit-logs — registro de auditoría de acciones administrativas
// (requisito 3.10/5.12 de la especificación). El backend ya devuelve lo más
// reciente primero, acotado a 200 entradas.
export const useAdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ logs: AuditLogEntry[] }>('/admin/audit-logs')
      .then((res) => setLogs(res.data.logs))
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar el registro de auditoría.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { logs, isLoading, error, reload: load };
};
