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

/**
 * Ruta tutor → domicilio del estudiante (POST /api/geo/route). Se vuelve a pedir
 * solo cuando cambian las coordenadas. Sin una de las dos, no hace nada.
 */
export const useTripRoute = (from: LatLng | undefined, to: LatLng | undefined) => {
  const [state, setState] = useState<RouteState | null>(null);

  const key = from && to ? `${from.lat},${from.lng}|${to.lat},${to.lng}` : null;

  useEffect(() => {
    if (!key || !from || !to) return;
    let cancelled = false;
    api
      .post<{ route: RouteInfo }>('/geo/route', { from, to })
      .then((res) => { if (!cancelled) setState({ key, route: res.data.route, failed: false }); })
      .catch(() => { if (!cancelled) setState({ key, route: null, failed: true }); });
    return () => { cancelled = true; };
    // from/to son objetos nuevos en cada render; `key` ya resume sus valores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // El resultado guardado solo vale si corresponde a las coordenadas actuales.
  const current = state && state.key === key ? state : null;
  return {
    route: current?.route ?? null,
    isLoading: key !== null && current === null,
    failed: current?.failed ?? false,
  };
};
