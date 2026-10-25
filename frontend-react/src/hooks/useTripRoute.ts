import { useEffect, useState } from 'react';
import api from '../services/api';
import type { RouteInfo } from '../types/api';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteState {
  key: string;
  route: RouteInfo | null;
  failed: boolean;
}

// Rutas ya calculadas en esta sesión: volver a un tutor ya visto no pide nada al servidor
// (en la búsqueda, pasar el mouse por la lista cambia la selección muy seguido).
const routeCache = new Map<string, RouteInfo>();

interface UseTripRouteOptions {
  /** Espera este tiempo con la selección quieta antes de pedir la ruta (por defecto, sin espera). */
  debounceMs?: number;
}

/**
 * Ruta entre dos puntos (POST /api/geo/route). Se vuelve a pedir solo cuando cambian
 * las coordenadas y se recuerda en memoria. Sin una de las dos, no hace nada.
 */
export const useTripRoute = (from: LatLng | undefined, to: LatLng | undefined, options: UseTripRouteOptions = {}) => {
  const { debounceMs = 0 } = options;
  const [state, setState] = useState<RouteState | null>(null);

  const key = from && to ? `${from.lat},${from.lng}|${to.lat},${to.lng}` : null;
  const cached = key ? routeCache.get(key) : undefined;

  useEffect(() => {
    if (!key || !from || !to || routeCache.has(key)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .post<{ route: RouteInfo }>('/geo/route', { from, to })
        .then((res) => {
          routeCache.set(key, res.data.route);
          if (!cancelled) setState({ key, route: res.data.route, failed: false });
        })
        .catch(() => { if (!cancelled) setState({ key, route: null, failed: true }); });
    }, debounceMs);
    return () => { cancelled = true; clearTimeout(timer); };
    // from/to son objetos nuevos en cada render; `key` ya resume sus valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debounceMs]);

  // El resultado guardado solo vale si corresponde a las coordenadas actuales.
  const current = cached ? { route: cached, failed: false } : state && state.key === key ? state : null;
  return {
    route: current?.route ?? null,
    isLoading: key !== null && current === null,
    failed: current?.failed ?? false,
  };
};
