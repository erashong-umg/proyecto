import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Course } from '../types/api';

export interface AdminOverviewCounts {
  totalUsers: number;
  pendingTutors: number;
  openReports: number;
  pendingAppeals: number;
  activeCourses: number;
}

// Conteos de overview para el Dashboard del panel admin. No existe un único
// endpoint de "conteos" en el backend (ver backend-express/src/routes/
// admin.routes.ts) — se arman combinando el listado de cada recurso, igual
// que useAdminUsers/useAdminTutors ya hacen por separado para sus propias
// páginas. GET /api/admin/users limita a 100 resultados server-side
// (admin.controller.ts::adminListUsers), así que "usuarios totales" es una
// cota superior razonable para un proyecto académico, no un conteo exacto
// en una base con más de 100 cuentas.
export const useAdmin = () => {
  const [counts, setCounts] = useState<AdminOverviewCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      api.get<{ users: unknown[] }>('/admin/users'),
      api.get<{ tutors: unknown[] }>('/admin/tutors/pending'),
      api.get<{ reports: unknown[] }>('/admin/reports', { params: { status: 'open' } }),
      api.get<{ appeals: { status: string }[] }>('/admin/appeals'),
      api.get<{ courses: Course[] }>('/courses'),
    ])
      .then(([usersRes, tutorsRes, reportsRes, appealsRes, coursesRes]) => {
        setCounts({
          totalUsers: usersRes.data.users.length,
          pendingTutors: tutorsRes.data.tutors.length,
          openReports: reportsRes.data.reports.length,
          pendingAppeals: appealsRes.data.appeals.filter((a) => a.status === 'pending').length,
          activeCourses: coursesRes.data.courses.length,
        });
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar los indicadores del panel.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { counts, isLoading, error, reload: load };
};
