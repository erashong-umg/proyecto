import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Fórmula de Haversine: distancia en km entre dos puntos en la Tierra.
 * Línea recta: sirve de respaldo cuando no hay ruta por calles (ver getRoute).
 */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

export interface RouteInfo {
  distanceKm: number;
  /** Duración estimada en auto; null cuando solo hay línea recta. */
  durationMin: number | null;
  /** Trayectoria como pares [lat, lng], lista para dibujar en Leaflet. */
  path: [number, number][];
  /** 'osrm' = ruta real por calles; 'straight-line' = respaldo Haversine. */
  source: 'osrm' | 'straight-line';
}

const OSRM_TIMEOUT_MS = 5000;

const round2 = (n: number): number => Math.round(n * 100) / 100;

const straightLine = (from: LatLng, to: LatLng): RouteInfo => ({
  distanceKm: round2(haversineKm(from, to)),
  durationMin: null,
  path: [[from.lat, from.lng], [to.lat, to.lng]],
  source: 'straight-line',
});

/**
 * Ruta por calles entre dos puntos usando OSRM. Si el servicio no responde, está
 * deshabilitado (OSRM_URL vacío) o no encuentra ruta, cae a línea recta para que
 * la reserva nunca quede bloqueada por un servicio externo.
 */
export const getRoute = async (from: LatLng, to: LatLng): Promise<RouteInfo> => {
  const base = env.OSRM_URL.replace(/\/+$/, '');
  if (!base) return straightLine(from, to);

  const url =
    `${base}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    '?overview=full&geometries=geojson';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(OSRM_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`OSRM respondió ${res.status}`);
    const data = (await res.json()) as {
      code?: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route) throw new Error(`OSRM sin ruta (${data.code ?? 'sin código'})`);

    return {
      distanceKm: round2(route.distance / 1000),
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      // GeoJSON viene como [lng, lat]; Leaflet espera [lat, lng].
      path: route.geometry.coordinates.map(([lng, lat]): [number, number] => [lat, lng]),
      source: 'osrm',
    };
  } catch (error) {
    logger.warn(`[Geo] Ruta OSRM no disponible, usando línea recta: ${(error as Error).message}`);
    return straightLine(from, to);
  }
};

export interface PriceBreakdown {
  distanceKm: number;
  baseAmount: number;          // Q
  transportAmount: number;     // Q
  total: number;               // Q
}

/**
 * Desglose de costo para una tutoría presencial a domicilio, a partir de la
 * distancia ya calculada.
 * - baseAmount = baseRate × horas
 * - transportAmount = distanceKm × ratePerKm
 * - total = baseAmount + transportAmount
 */
export const buildTripPrice = (
  baseRate: number,
  ratePerKm: number,
  hours: number,
  distanceKm: number
): PriceBreakdown => {
  const baseAmount = round2(baseRate * hours);
  const transportAmount = round2(distanceKm * ratePerKm);
  return { distanceKm: round2(distanceKm), baseAmount, transportAmount, total: round2(baseAmount + transportAmount) };
};

/**
 * Cotiza una tutoría a domicilio: calcula la ruta real y el desglose sobre esa
 * distancia. Es lo que se guarda en la reserva y lo que ve el estudiante.
 */
export const quoteTrip = async (
  baseRate: number,
  ratePerKm: number,
  hours: number,
  tutorCoords: LatLng,
  studentCoords: LatLng
): Promise<{ breakdown: PriceBreakdown; route: RouteInfo }> => {
  const route = await getRoute(tutorCoords, studentCoords);
  return { breakdown: buildTripPrice(baseRate, ratePerKm, hours, route.distanceKm), route };
};

/**
 * Para MongoDB: convierte {lat, lng} a formato GeoJSON Point [lng, lat].
 */
export const toGeoJsonPoint = (coords: LatLng): { type: 'Point'; coordinates: [number, number] } => ({
  type: 'Point',
  coordinates: [coords.lng, coords.lat],     // GeoJSON: [longitud, latitud]
});
