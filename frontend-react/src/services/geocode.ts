// Nominatim (OpenStreetMap) — geocodificación gratis, sin API key. Uso
// responsable: solo se llama por acción explícita del usuario (botón/Enter),
// nunca en cada tecla, para respetar el límite de 1 req/seg de su política.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export const geocodeAddress = async (query: string): Promise<GeocodeResult | null> => {
  const q = query.trim();
  if (!q) return null;

  const params = new URLSearchParams({
    q,
    format: 'json',
    countrycodes: 'gt', // plataforma solo opera en Guatemala
    limit: '1',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`);
  if (!res.ok) throw new Error('No se pudo buscar la dirección.');

  const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
  if (data.length === 0) return null;

  const [first] = data;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), displayName: first.display_name };
};
