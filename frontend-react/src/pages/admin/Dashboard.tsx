import type { LucideIcon } from 'lucide-react';
import { Users, GraduationCap, ShieldAlert, FileQuestion, BookOpen, CalendarCheck, TriangleAlert } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import styles from './Dashboard.module.scss';

type Accent = 'primary' | 'warning' | 'danger' | 'success';

interface OverviewCard {
  key: string;
  label: string;
  value: number | null;
  icon: LucideIcon;
  accent: Accent;
}

export const AdminDashboardPage = () => {
  const { counts, isLoading: countsLoading, error: countsError } = useAdmin();
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAdminAnalytics();

  const isLoading = countsLoading || analyticsLoading;
  const error = countsError ?? analyticsError;

  // "Reservas del mes" no tiene un conteo propio en el backend: se deriva
  // sumando todos los estados de monthlyStats (pending/confirmed/completed/
  // cancelled) que adminAnalytics ya agrupa sobre el último mes.
  const monthlyBookings = analytics
    ? analytics.monthlyStats.reduce((sum, s) => sum + s.count, 0)
    : null;

  const cards: OverviewCard[] = [
    {
      key: 'users',
      label: 'Usuarios totales',
      value: counts?.totalUsers ?? null,
      icon: Users,
      accent: 'primary',
    },
    {
      key: 'pending-tutors',
      label: 'Tutores pendientes de aprobar',
      value: counts?.pendingTutors ?? null,
      icon: GraduationCap,
      accent: 'warning',
    },
    {
      key: 'reports',
      label: 'Denuncias abiertas',
      value: counts?.openReports ?? null,
      icon: ShieldAlert,
      accent: 'danger',
    },
    {
      key: 'appeals',
      label: 'Apelaciones pendientes',
      value: counts?.pendingAppeals ?? null,
      icon: FileQuestion,
      accent: 'warning',
    },
    {
      key: 'courses',
      label: 'Cursos activos',
      value: counts?.activeCourses ?? null,
      icon: BookOpen,
      accent: 'primary',
    },
    {
      key: 'bookings',
      label: 'Reservas del último mes',
      value: monthlyBookings,
      icon: CalendarCheck,
      accent: 'success',
    },
  ];

  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        Indicadores generales de la plataforma, obtenidos en tiempo real desde el backend.
      </p>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <TriangleAlert aria-hidden="true" />
          {error}
        </div>
      )}

      <div className={styles.grid}>
        {cards.map(({ key, label, value, icon: Icon, accent }) => (
          <div key={key} className={`${styles.card} ${styles[accent]}`}>
            <div className={styles.cardIcon}>
              <Icon aria-hidden="true" />
            </div>
            <div>
              <p className={styles.cardValue}>{isLoading ? '—' : (value ?? '—')}</p>
              <p className={styles.cardLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
