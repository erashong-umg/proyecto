import { Link } from 'react-router-dom';
import { MapPin, CalendarCheck, MessageCircle, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import styles from './Home.module.scss';

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>Conectamos estudiantes con tutores especializados</h1>
            <p className={styles.heroSubtitle}>
              Encuentre profesores de idiomas, deportes, ciencias, tecnología y posgrado. Modalidad virtual o presencial.
            </p>
            <div className={styles.heroActions}>
              {user?.role === 'tutor' ? (
                <Link to="/tutor/dashboard">
                  <Button size="lg">Ir a mi panel</Button>
                </Link>
              ) : (
                <Link to="/tutores">
                  <Button size="lg">Buscar tutores</Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/register">
                  <Button size="lg" variant="secondary">Crear cuenta gratuita</Button>
                </Link>
              )}
              {isAuthenticated && user && (
                <p className={styles.welcome}>Bienvenido/a, {user.name}.</p>
              )}
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.routeCard}>
              <svg width="100%" height="120" viewBox="0 0 280 120" fill="none">
                <path d="M24 96 C 90 30, 170 100, 256 24" stroke="#dc541a" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
                <circle cx="24" cy="96" r="8" fill="#dc541a" />
                <circle cx="256" cy="24" r="8" fill="#dc541a" />
              </svg>
              <span className={`${styles.routeBadge} ${styles.badgeDistance}`}>3.2 km</span>
              <span className={`${styles.routeBadge} ${styles.badgeRate}`}>Q120 traslado</span>
            </div>
            <div className={styles.chipRow}>
              <span>Idiomas</span>
              <span>Cálculo</span>
              <span>Natación</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.journey}>
        <div className="container">
          <h2 className={styles.journeyTitle}>Su ruta en EducaSpot</h2>
          <ol className={styles.route}>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><MapPin aria-hidden="true" /></span>
              <h3>Encuentre a su tutor</h3>
              <p>Cálculo automático de distancia y costo de traslado si el tutor va a su domicilio.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><CalendarCheck aria-hidden="true" /></span>
              <h3>Reserve sin conflictos</h3>
              <p>Sistema de reservas que garantiza que no se solapen tutorías en su agenda ni en la del tutor.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><MessageCircle aria-hidden="true" /></span>
              <h3>Coordine por chat</h3>
              <p>Hable con su tutor por chat en tiempo real antes y durante la clase.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><Star aria-hidden="true" /></span>
              <h3>Califique la sesión</h3>
              <p>Cada sesión completada puede calificarse para mantener la calidad de la plataforma.</p>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
};
