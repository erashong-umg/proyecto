import { Star, ThumbsDown, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { useAdminAnalytics } from '../../hooks';
import { formatShortDate } from '../../services/formatters';
import type { AdminCategoryDemand, AdminMonthlyStat, AdminTopTutor, BookingStatus } from '../../types/api';
import styles from './Analytics.module.scss';

const BOOKING_STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  completed: 'Completadas',
  cancelled: 'Canceladas',
};

// Paleta de 6 tonos derivados de los tokens semánticos existentes (nunca
// hex) — suficiente para distinguir hasta 5 categorías + un bucket "Otras".
const DONUT_SLICE_STYLES = ['sliceA', 'sliceB', 'sliceC', 'sliceD', 'sliceE', 'sliceF'] as const;
const MAX_DONUT_SLICES = DONUT_SLICE_STYLES.length;

export const AdminAnalyticsPage = () => {
  const { data, isLoading, error } = useAdminAnalytics();

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Analítica</h1>
        <p className={styles.subtitle}>
          Indicadores de la plataforma: tutores mejor calificados, demanda por categoría y actividad
          de reservas del último mes.
          {data && <span className={styles.generatedAt}> Generado el {formatShortDate(data.generatedAt)}.</span>}
        </p>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : data ? (
        <div className={styles.grid}>
          <TutorRatingChart
            tutors={data.topTutors}
            icon={Star}
            title="Top 5 tutores por calificación"
            emptyMessage="Aún no hay tutores con reseñas suficientes para mostrar un ranking."
            chartId="top-tutors"
          />
          <TutorRatingChart
            tutors={data.bottomTutors}
            icon={ThumbsDown}
            title="5 tutores con menor calificación"
            emptyMessage="Aún no hay tutores con reseñas suficientes para mostrar un ranking."
            chartId="bottom-tutors"
          />
          <CategoryDemandChart demand={data.categoryDemand} />
          <MonthlyStatusChart stats={data.monthlyStats} />
        </div>
      ) : null}
    </div>
  );
};

interface TutorRatingChartProps {
  tutors: AdminTopTutor[];
  icon: typeof Star;
  title: string;
  emptyMessage: string;
  chartId: string;
}

const TutorRatingChart = ({ tutors, icon: Icon, title, emptyMessage, chartId }: TutorRatingChartProps) => {
  if (tutors.length === 0) {
    return (
      <figure className={styles.chartCard}>
        <figcaption className={styles.chartTitle}><Icon aria-hidden="true" /> {title}</figcaption>
        <div className={styles.emptyChart}>{emptyMessage}</div>
      </figure>
    );
  }

  const rowHeight = 40;
  const chartTop = 6;
  const maxRating = 5;
  const width = 360;
  const barMaxWidth = width - 150;
  const height = chartTop * 2 + tutors.length * rowHeight;
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartTitle}><Icon aria-hidden="true" /> {title}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className={styles.svg}
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>
          Gráfico de barras horizontales.{' '}
          {tutors
            .map((t) => `${t.name}: ${t.tutorData.avgRating.toFixed(1)} de 5 con ${t.tutorData.reviewCount} reseñas.`)
            .join(' ')}
        </desc>
        {tutors.map((t, i) => {
          const y = chartTop + i * rowHeight;
          const barWidth = Math.max((t.tutorData.avgRating / maxRating) * barMaxWidth, 2);
          return (
            <g key={t._id}>
              <text x={0} y={y + 12} className={styles.axisLabel}>{t.name}</text>
              <rect x={0} y={y + 18} width={barMaxWidth} height={10} className={styles.barTrack} />
              <rect x={0} y={y + 18} width={barWidth} height={10} className={styles.barFill} />
              <text x={barMaxWidth + 8} y={y + 27} className={styles.barValue}>
                {t.tutorData.avgRating.toFixed(1)} ({t.tutorData.reviewCount})
              </text>
            </g>
          );
        })}
      </svg>
      <details className={styles.dataTable}>
        <summary>Ver datos en tabla</summary>
        <table>
          <thead><tr><th>Tutor</th><th>Calificación</th><th>Reseñas</th></tr></thead>
          <tbody>
            {tutors.map((t) => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>{t.tutorData.avgRating.toFixed(1)}</td>
                <td>{t.tutorData.reviewCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
};

const CategoryDemandChart = ({ demand }: { demand: AdminCategoryDemand[] }) => {
  const TOP_N = 5;
  const sorted = [...demand].sort((a, b) => b.totalHours - a.totalHours);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const restTotal = rest.reduce((sum, c) => sum + c.totalHours, 0);
  const slices = restTotal > 0
    ? [...top, { categoryName: 'Otras categorías', totalHours: restTotal, count: rest.reduce((s, c) => s + c.count, 0) }]
    : top;
  const total = slices.reduce((sum, s) => sum + s.totalHours, 0);

  if (demand.length === 0 || total === 0) {
    return (
      <figure className={styles.chartCard}>
        <figcaption className={styles.chartTitle}><PieChartIcon aria-hidden="true" /> Demanda por categoría</figcaption>
        <div className={styles.emptyChart}>
          Aún no hay reservas confirmadas o completadas para calcular la demanda por categoría.
        </div>
      </figure>
    );
  }

  const radius = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const arcs = slices.map((s, i) => {
    const fraction = total > 0 ? s.totalHours / total : 0;
    const dash = fraction * circumference;
    const offset = -cumulative * circumference;
    cumulative += fraction;
    return { ...s, fraction, dash, offset, styleKey: DONUT_SLICE_STYLES[i % MAX_DONUT_SLICES] };
  });

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartTitle}><PieChartIcon aria-hidden="true" /> Demanda por categoría (horas reservadas)</figcaption>
      <svg
        viewBox="0 0 220 220"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="category-demand-title category-demand-desc"
        className={styles.svg}
      >
        <title id="category-demand-title">Distribución de demanda por categoría</title>
        <desc id="category-demand-desc">
          Gráfico de dona.{' '}
          {arcs.map((a) => `${a.categoryName}: ${(a.fraction * 100).toFixed(0)} por ciento.`).join(' ')}
        </desc>
        <g transform="translate(110 110) rotate(-90)">
          <circle r={radius} fill="none" strokeWidth={strokeWidth} className={styles.donutTrack} />
          {arcs.map((a) => (
            <circle
              key={a.categoryName}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={a.offset}
              className={styles[a.styleKey]}
            />
          ))}
        </g>
        <text x={110} y={105} textAnchor="middle" className={styles.donutCenterValue}>{total.toFixed(0)}h</text>
        <text x={110} y={123} textAnchor="middle" className={styles.donutCenterLabel}>reservadas</text>
      </svg>
      <ul className={styles.legend}>
        {arcs.map((a) => (
          <li key={a.categoryName}>
            <span className={`${styles.legendDot} ${styles[a.styleKey]}`} aria-hidden="true" />
            {a.categoryName} · {(a.fraction * 100).toFixed(0)}%
          </li>
        ))}
      </ul>
      <details className={styles.dataTable}>
        <summary>Ver datos en tabla</summary>
        <table>
          <thead><tr><th>Categoría</th><th>Horas</th><th>Reservas</th></tr></thead>
          <tbody>
            {arcs.map((a) => (
              <tr key={a.categoryName}>
                <td>{a.categoryName}</td>
                <td>{a.totalHours.toFixed(1)}</td>
                <td>{a.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
};

const MonthlyStatusChart = ({ stats }: { stats: AdminMonthlyStat[] }) => {
  const byStatus = new Map(stats.map((s) => [s._id, s.count]));
  const points = BOOKING_STATUS_ORDER.map((status) => ({ status, count: byStatus.get(status) ?? 0 }));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  if (total === 0) {
    return (
      <figure className={styles.chartCard}>
        <figcaption className={styles.chartTitle}><TrendingUp aria-hidden="true" /> Reservas del último mes</figcaption>
        <div className={styles.emptyChart}>No se registraron reservas en los últimos 30 días.</div>
      </figure>
    );
  }

  const width = 360;
  const height = 170;
  const paddingX = 36;
  const paddingTop = 20;
  const paddingBottom = 34;
  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const stepX = (width - paddingX * 2) / (points.length - 1 || 1);
  const coords = points.map((p, i) => ({
    ...p,
    x: paddingX + i * stepX,
    y: height - paddingBottom - (p.count / maxCount) * (height - paddingTop - paddingBottom),
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const baseline = height - paddingBottom;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`;

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartTitle}><TrendingUp aria-hidden="true" /> Reservas del último mes, por estado</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="monthly-stats-title monthly-stats-desc"
        className={styles.svg}
      >
        <title id="monthly-stats-title">Reservas de los últimos 30 días por estado</title>
        <desc id="monthly-stats-desc">
          Gráfico de líneas.{' '}
          {coords.map((c) => `${BOOKING_STATUS_LABELS[c.status]}: ${c.count}.`).join(' ')}
        </desc>
        <line x1={paddingX} y1={baseline} x2={width - paddingX} y2={baseline} className={styles.axisLine} />
        <path d={areaPath} className={styles.lineArea} />
        <path d={linePath} className={styles.linePath} />
        {coords.map((c) => (
          <g key={c.status}>
            <circle cx={c.x} cy={c.y} r={4} className={styles.linePoint} />
            <text x={c.x} y={baseline + 18} textAnchor="middle" className={styles.axisLabel}>
              {BOOKING_STATUS_LABELS[c.status]}
            </text>
            <text x={c.x} y={c.y - 8} textAnchor="middle" className={styles.lineValue}>{c.count}</text>
          </g>
        ))}
      </svg>
      <p className={styles.chartCaption}>
        Conteo de reservas creadas en los últimos 30 días según su estado actual — no es una serie
        histórica mes a mes.
      </p>
      <details className={styles.dataTable}>
        <summary>Ver datos en tabla</summary>
        <table>
          <thead><tr><th>Estado</th><th>Reservas</th></tr></thead>
          <tbody>
            {coords.map((c) => (
              <tr key={c.status}>
                <td>{BOOKING_STATUS_LABELS[c.status]}</td>
                <td>{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
};
