import { useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TOUR_START_EVENT, tourForPath } from './tours';
import styles from './TourHelpButton.module.scss';

// Botón "?" del encabezado: repite la guía de la página actual. Solo aparece en
// las páginas que tienen guía.
export const TourHelpButton = () => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user?.onboardingCompleted || !tourForPath(pathname, user.role)) return null;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
      aria-label="Ver la guía de esta página"
      title="Guía de esta página"
    >
      <CircleHelp aria-hidden="true" />
    </button>
  );
};
