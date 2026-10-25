// Vista previa del precio en el formulario de reserva (la distancia viene de la
// ruta que calcula el backend). El backend recalcula todo al crear la reserva.

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

// `distanceKm` es la distancia de la ruta (ver useTripRoute); sin ella no hay
// traslado que cobrar. Debe coincidir con el cálculo del backend al reservar.
export const calculateTripPrice = (
  baseRate: number,
  ratePerKm: number,
  hours: number,
  distanceKm: number | undefined
): PriceBreakdown => {
  const baseAmount = Math.round(baseRate * hours * 100) / 100;

  if (distanceKm === undefined) {
    return { baseAmount, transportAmount: 0, total: baseAmount };
  }

  const transportAmount = Math.round(distanceKm * ratePerKm * 100) / 100;
  const total = Math.round((baseAmount + transportAmount) * 100) / 100;
  return { distanceKm: Math.round(distanceKm * 100) / 100, baseAmount, transportAmount, total };
};
