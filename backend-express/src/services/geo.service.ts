export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Fórmula de Haversine: distancia en km entre dos puntos en la Tierra.
 * Suficientemente precisa para nuestro caso académico (no requiere API de routing).
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

export interface PriceBreakdown {
  distanceKm: number;
  baseAmount: number;          // Q
  transportAmount: number;     // Q
  total: number;               // Q
}

/**
 * Calcula el desglose de costo para una tutoría presencial a domicilio.
 * - baseAmount = baseRate × horas
 * - transportAmount = distanceKm × ratePerKm
 * - total = baseAmount + transportAmount
 */
export const calculateTripPrice = (
  baseRate: number,
  ratePerKm: number,
  hours: number,
  tutorCoords: LatLng,
  studentCoords: LatLng
): PriceBreakdown => {
  const distanceKm = haversineKm(tutorCoords, studentCoords);
  const baseAmount = Math.round(baseRate * hours * 100) / 100;
  const transportAmount = Math.round(distanceKm * ratePerKm * 100) / 100;
  const total = Math.round((baseAmount + transportAmount) * 100) / 100;
  return { distanceKm: Math.round(distanceKm * 100) / 100, baseAmount, transportAmount, total };
};

/**
 * Para MongoDB: convierte {lat, lng} a formato GeoJSON Point [lng, lat].
 */
export const toGeoJsonPoint = (coords: LatLng): { type: 'Point'; coordinates: [number, number] } => ({
  type: 'Point',
  coordinates: [coords.lng, coords.lat],     // GeoJSON: [longitud, latitud]
});
