import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Joyride, EVENTS, type EventHandler } from 'react-joyride';
import { useAuth } from '../../hooks/useAuth';
import { TOUR_START_EVENT, hasSeenTour, markTourSeen, tourForPath } from './tours';

// Color del tema en uso (la administración puede personalizarlo), leído al abrir la guía.
const cssVar = (name: string, fallback: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// Cuánto espera la guía automática a que aparezca su primer elemento.
const WAIT_FOR_TARGET_MS = 20000;

const LOCALE = {
  back: 'Atrás',
  close: 'Cerrar',
  last: 'Entendido',
  next: 'Siguiente',
  nextWithProgress: 'Siguiente ({current} de {total})',
  open: 'Abrir la guía',
  skip: 'Omitir guía',
};

/**
 * Guía rápida de la página actual (React Joyride). Arranca sola la primera vez
 * en las páginas clave de cada rol y se puede repetir con el botón "?" del
 * encabezado. Una vez vista (o cerrada) no vuelve a salir sola.
 */
export const GuidedTour = () => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [run, setRun] = useState(false);

  const tour = isAuthenticated && user?.onboardingCompleted ? tourForPath(pathname, user.role) : null;
  const userId = user?._id;
  const tourId = tour?.id;
  const autoStart = tour?.autoStart ?? false;

  // Arranque automático la primera vez. Espera a que exista el primer elemento de
  // la guía: algunas páginas tardan en pintarse (p. ej. la búsqueda pide la
  // ubicación antes de mostrar el buscador) y, si arrancara antes, Joyride se
  // saltaría ese paso. Al cambiar de página se reinicia.
  const firstTarget = tour?.steps[0]?.target;
  useEffect(() => {
    if (!tourId || !userId || !autoStart || hasSeenTour(userId, tourId)) return;
    if (typeof firstTarget !== 'string') return;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const poll = () => {
      if (document.querySelector(firstTarget)) {
        timer = setTimeout(() => setRun(true), 500);          // deja que termine de asentarse
      } else if (Date.now() - startedAt < WAIT_FOR_TARGET_MS) {
        timer = setTimeout(poll, 300);
      }
    };
    poll();
    return () => { clearTimeout(timer); setRun(false); };
  }, [tourId, userId, autoStart, firstTarget]);

  // Arranque manual desde el botón de ayuda.
  useEffect(() => {
    const start = () => setRun(true);
    window.addEventListener(TOUR_START_EVENT, start);
    return () => window.removeEventListener(TOUR_START_EVENT, start);
  }, []);

  const options = useMemo(() => {
    if (!run) return undefined;
    return {
      primaryColor: cssVar('--color-primary', '#b83d17'),
      backgroundColor: cssVar('--color-surface', '#ffffff'),
      textColor: cssVar('--color-text', '#1a1a1a'),
      arrowColor: cssVar('--color-surface', '#ffffff'),
      overlayColor: 'rgba(0, 0, 0, 0.55)',
      zIndex: 1300,
      width: 340,
      showProgress: true,
      skipBeacon: true,
      buttons: ['back', 'skip', 'primary'] as ('back' | 'close' | 'primary' | 'skip')[],
      // Espera a que aparezca el elemento (p. ej. los resultados de la búsqueda).
      targetWaitTimeout: 6000,
      scrollDuration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
    };
  }, [run]);

  const onEvent: EventHandler = (data) => {
    // Al terminar, omitirla o cerrarla: ya no vuelve a salir sola.
    if (data.type === EVENTS.TOUR_END) {
      if (userId && tourId) markTourSeen(userId, tourId);
      setRun(false);
    }
  };

  if (!tour) return null;

  return (
    <Joyride
      key={tour.id}
      run={run}
      steps={tour.steps}
      continuous
      locale={LOCALE}
      options={options}
      onEvent={onEvent}
    />
  );
};
