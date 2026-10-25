import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarClock, ClipboardList, CircleCheck, TriangleAlert, Check, Clock, PartyPopper,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTutorSetup } from '../../hooks/useTutorSetup';
import { Button } from '../../components/ui/Button';
import styles from './Dashboard.module.scss';

interface SetupStep {
  key: string;
  title: string;
  detail: string;
  done: boolean;
  /** Dónde se completa; sin `to`, depende de la administración y solo se espera. */
  to?: string;
  action?: string;
}

export const TutorDashboardPage = () => {
  const { user } = useAuth();
  const approved = user?.tutorData?.approved ?? false;
  const { isLoading, hasAvailability, courseCount, upcomingCount } = useTutorSetup();

  // El perfil (biografía, CV, tarifas) ya se completó en el onboarding para llegar aquí.
  const steps: SetupStep[] = [
    {
      key: 'perfil',
      title: 'Complete su perfil',
      detail: 'Biografía, CV y tarifas.',
      done: true,
    },
    {
      key: 'horarios',
      title: 'Publique sus horarios',
      detail: 'Los estudiantes solo pueden reservar dentro de los horarios que usted marque.',
      done: hasAvailability,
      to: '/tutor/disponibilidad',
      action: 'Configurar horarios',
    },
    {
      key: 'curso',
      title: 'Cree su primer curso',
      detail: 'Título, categoría y modalidades. Usa las tarifas de su perfil.',
      done: courseCount > 0,
      to: '/tutor/cursos',
      action: 'Crear curso',
    },
    {
      key: 'aprobacion',
      title: 'Aprobación de la administración',
      detail: approved
        ? 'Su cuenta fue aprobada: ya aparece en las búsquedas.'
        : 'En revisión. Aparecerá en las búsquedas de los estudiantes cuando se apruebe; mientras tanto puede preparar lo demás.',
      done: approved,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  // El primer paso que depende del tutor y falta: es el que se destaca.
  const nextKey = steps.find((s) => !s.done && s.to)?.key;

  return (
    <div className={`${styles.page} container`}>
      <h1>Panel del tutor</h1>
      <p className={styles.welcome}>
        Bienvenido/a, {user?.name}.
        <span className={approved ? styles.approvedBadge : styles.pendingBadge}>
          {approved ? <CircleCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
          {approved ? 'Cuenta aprobada' : 'Pendiente de aprobación'}
        </span>
      </p>

      {!isLoading && (allDone ? (
        <div className={styles.ready} role="status" data-tour="tutor-checklist">
          <PartyPopper aria-hidden="true" />
          <div>
            <strong>Todo listo.</strong> Ya aparece en las búsquedas y puede recibir reservas.
          </div>
        </div>
      ) : (
        <section className={styles.checklist} aria-labelledby="checklist-title" data-tour="tutor-checklist">
          <div className={styles.checklistHead}>
            <h2 id="checklist-title">Para empezar a recibir reservas</h2>
            <span className={styles.progressText}>{doneCount} de {steps.length}</span>
          </div>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={doneCount}
            aria-label="Avance de la configuración"
          >
            <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>

          <ol className={styles.steps}>
            {steps.map((step, i) => {
              const waiting = !step.done && !step.to;
              return (
                <li
                  key={step.key}
                  className={`${styles.step} ${step.done ? styles.stepDone : ''} ${step.key === nextKey ? styles.stepNext : ''}`}
                >
                  <span className={styles.stepMark} aria-hidden="true">
                    {step.done ? <Check /> : waiting ? <Clock /> : i + 1}
                  </span>
                  <div className={styles.stepText}>
                    <h3>
                      {step.title}
                      {step.done && <span className="sr-only"> (hecho)</span>}
                      {waiting && <span className="sr-only"> (en espera)</span>}
                    </h3>
                    <p>{step.detail}</p>
                  </div>
                  {!step.done && step.to && (
                    <Link to={step.to} className={styles.stepAction}>
                      <Button size="sm" variant={step.key === nextKey ? 'primary' : 'secondary'}>{step.action}</Button>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <div className={styles.grid}>
        <Link to="/tutor/cursos" className={styles.card}>
          <BookOpen aria-hidden="true" />
          <h3>Mis cursos</h3>
          <p>{courseCount > 0 ? `${courseCount} ${courseCount === 1 ? 'curso activo' : 'cursos activos'}.` : 'Cree y gestione sus ofertas de tutoría.'}</p>
        </Link>

        <Link to="/tutor/disponibilidad" className={styles.card}>
          <CalendarClock aria-hidden="true" />
          <h3>Disponibilidad</h3>
          <p>{hasAvailability ? 'Horarios publicados. Puede ajustarlos cuando quiera.' : 'Configure su cuadrícula semanal de horarios.'}</p>
        </Link>

        <Link to="/tutor/reservas" className={styles.card}>
          <ClipboardList aria-hidden="true" />
          <h3>Reservas recibidas</h3>
          <p>{upcomingCount > 0 ? `${upcomingCount} ${upcomingCount === 1 ? 'tutoría próxima' : 'tutorías próximas'}.` : 'Revise las tutorías que le agendaron.'}</p>
        </Link>
      </div>
    </div>
  );
};
