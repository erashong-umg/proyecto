import type { Step } from 'react-joyride';
import type { UserRole } from '../../types/user';

export type TourId = 'buscar' | 'reserva' | 'panel-tutor' | 'reservas' | 'chat';

export interface TourDef {
  id: TourId;
  /** Quién ve esta guía. */
  roles: UserRole[];
  /** Si arranca sola la primera vez. Las demás solo con el botón "?" del encabezado. */
  autoStart: boolean;
  steps: Step[];
}

// Guías cortas, una por página y de 1 a 3 pasos: la idea es orientar sin abrumar.
// Arrancan solas únicamente en las páginas clave de cada rol (buscar, reservar y
// el panel del tutor); el resto se abre a demanda con el botón de ayuda.
export const TOURS: Record<TourId, TourDef> = {
  buscar: {
    id: 'buscar',
    roles: ['student'],
    autoStart: true,
    steps: [
      {
        target: '[data-tour="buscar-barra"]',
        title: 'Busque por materia',
        content: 'Escriba lo que quiere aprender (inglés, natación, programación…) y verá los tutores cercanos. Con «Filtros» afina por distancia, calificación, reseñas, precio y modalidad.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="buscar-mapa"]',
        title: 'Usted y los tutores',
        content: 'El punto naranja con pulso es usted; cada pin es un tutor cercano. Pulse un pin para verlo en la lista.',
        placement: 'right',
      },
      {
        target: '[data-tour="buscar-resultados"]',
        title: 'Elija un tutor',
        content: 'Abra un perfil para ver sus cursos y reseñas, y reservar una tutoría.',
        placement: 'left',
      },
    ],
  },
  reserva: {
    id: 'reserva',
    roles: ['student'],
    autoStart: true,
    steps: [
      {
        target: '[data-tour="booking-widget"]',
        title: 'Reserve en 3 pasos',
        content: 'Elija qué quiere aprender, cuándo (solo verá horas realmente libres) y confirme. Para clases a domicilio verá el mapa con la ruta y el costo del traslado.',
        placement: 'left',
      },
    ],
  },
  reservas: {
    id: 'reservas',
    roles: ['student'],
    autoStart: false,
    steps: [
      {
        target: '[data-tour="reservas-lista"]',
        title: 'Sus tutorías',
        content: 'Aquí están sus reservas, en lista o en calendario (día, semana y mes). Las tutorías se marcan como completadas solas al terminar; entonces podrá calificarlas o reportar un problema.',
        placement: 'top',
      },
    ],
  },
  'panel-tutor': {
    id: 'panel-tutor',
    roles: ['tutor'],
    autoStart: true,
    steps: [
      {
        target: '[data-tour="tutor-checklist"]',
        title: 'Sus pasos para empezar',
        content: 'Siga esta lista para recibir reservas. El paso resaltado es el que le toca ahora; la aprobación depende de la administración.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="tutor-tarjetas"]',
        title: 'Accesos rápidos',
        content: 'Sus cursos, sus horarios y las reservas que reciba, siempre a un clic.',
        placement: 'top',
      },
    ],
  },
  chat: {
    id: 'chat',
    roles: ['student', 'tutor'],
    autoStart: false,
    steps: [
      {
        target: '[data-tour="chat-bandeja"]',
        title: 'Sus conversaciones',
        content: 'Escríbale a un tutor o estudiante desde su perfil o una reserva. Verá los mensajes sin leer.',
        placement: 'right',
      },
      {
        target: '[data-tour="chat-redactor"]',
        title: 'Escriba aquí',
        content: 'Enter envía el mensaje. Un check es enviado, dos es entregado y dos azules es leído.',
        placement: 'top',
      },
    ],
  },
};

/** Guía que corresponde a una ruta y a un rol, si la hay. */
export const tourForPath = (pathname: string, role: UserRole | undefined): TourDef | null => {
  if (!role) return null;
  let id: TourId | null = null;
  if (pathname === '/tutores') id = 'buscar';
  else if (/^\/tutores\/[^/]+$/.test(pathname)) id = 'reserva';
  else if (pathname === '/mis-reservas') id = 'reservas';
  else if (pathname === '/tutor/dashboard') id = 'panel-tutor';
  else if (pathname === '/chat') id = 'chat';
  const tour = id ? TOURS[id] : null;
  return tour && tour.roles.includes(role) ? tour : null;
};

// ---- Qué guías ya vio cada persona (por navegador y por usuario) ----

const STORAGE_KEY = 'educaspot_tours_vistos';

const readSeen = (): Record<string, TourId[]> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
};

export const hasSeenTour = (userId: string, id: TourId): boolean => readSeen()[userId]?.includes(id) ?? false;

export const markTourSeen = (userId: string, id: TourId): void => {
  try {
    const seen = readSeen();
    seen[userId] = [...new Set([...(seen[userId] ?? []), id])];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Sin localStorage (modo privado, bloqueado): la guía se puede ver de nuevo, sin más.
  }
};

/** Evento con el que el botón de ayuda pide arrancar la guía de la página actual. */
export const TOUR_START_EVENT = 'educaspot:tour-start';
