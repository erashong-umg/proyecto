import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { AdminAnalytics } from '../types/api';

// Re-exportadas aquí (además de types/api.ts) porque otro módulo del panel
// de administración importa estos tipos vía './useAdminAnalytics' en
// hooks/index.ts — ver ese barrel antes de "limpiar" este re-export.
export type { AdminAnalytics, AdminTopTutor, AdminCategoryDemand, AdminMonthlyStat } from '../types/api';

/** Reportería del panel de administración (GET /api/admin/analytics). */
export const useAdminAnalytics = () => {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<AdminAnalytics>('/admin/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las estadísticas.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, reload: load };
};
