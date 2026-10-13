import { Link } from 'react-router-dom';
import { BookOpen, CalendarClock, ClipboardList, CircleCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './Dashboard.module.scss';

export const TutorDashboardPage = () => {
  const { user } = useAuth();
  const approved = user?.tutorData?.approved ?? false;

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

      <div className={styles.grid}>
        <Link to="/tutor/cursos" className={styles.card}>
          <BookOpen aria-hidden="true" />
          <h3>Mis cursos</h3>
          <p>Cree y gestione sus ofertas de tutoría.</p>
        </Link>

        <Link to="/tutor/disponibilidad" className={styles.card}>
          <CalendarClock aria-hidden="true" />
          <h3>Disponibilidad</h3>
          <p>Configure su cuadrícula semanal de horarios.</p>
        </Link>

        <Link to="/tutor/reservas" className={styles.card}>
          <ClipboardList aria-hidden="true" />
          <h3>Reservas recibidas</h3>
          <p>Revise y gestione las tutorías que le agendaron.</p>
        </Link>
      </div>

      {!approved && (
        <div className={styles.pendingMsg}>
          <TriangleAlert aria-hidden="true" />
          Su perfil aún no fue aprobado por la administración. Hasta entonces, no aparecerá
          en las búsquedas de los estudiantes, pero ya puede preparar sus cursos y horarios.
        </div>
      )}
    </div>
  );
};
