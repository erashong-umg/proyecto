// Espejo de backend-express/src/services/geo.service.ts — misma fórmula,
// para poder previsualizar el precio en el formulario de reserva sin pegarle
// al backend en cada cambio del formulario. El backend recalcula y valida
// esto mismo al crear la reserva; esto es solo una vista previa.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

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
  distanceKm?: number;
  baseAmount: number;
  transportAmount: number;
  total: number;
}

export const calculateTripPrice = (
  baseRate: number,
  ratePerKm: number,
  hours: number,
  tutorCoords: LatLng | undefined,
  studentCoords: LatLng | undefined
): PriceBreakdown => {
  const baseAmount = Math.round(baseRate * hours * 100) / 100;

  if (!tutorCoords || !studentCoords) {
    return { baseAmount, transportAmount: 0, total: baseAmount };
  }

  const distanceKm = haversineKm(tutorCoords, studentCoords);
  const transportAmount = Math.round(distanceKm * ratePerKm * 100) / 100;
  const total = Math.round((baseAmount + transportAmount) * 100) / 100;
  return { distanceKm: Math.round(distanceKm * 100) / 100, baseAmount, transportAmount, total };
};
