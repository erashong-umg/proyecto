import { describe, it, expect, afterEach, vi } from 'vitest';
import { env } from '../src/config/env';
import { buildTripPrice, getRoute, quoteTrip } from '../src/services/geo.service';

// Zona 10 → Zona 1 de Guatemala (aprox. 4 km en línea recta).
const tutor = { lat: 14.5905, lng: -90.5155 };
const student = { lat: 14.6349, lng: -90.5069 };

const osrmOk = {
  code: 'Ok',
  routes: [{
    distance: 6240,
    duration: 780,
    geometry: { coordinates: [[-90.5155, 14.5905], [-90.511, 14.61], [-90.5069, 14.6349]] },
  }],
};

const mockFetch = (impl: () => Promise<unknown>) => {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
};

const originalUrl = env.OSRM_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  env.OSRM_URL = originalUrl;
});

describe('getRoute', () => {
  it('usa la ruta por calles de OSRM y convierte [lng,lat] a [lat,lng]', async () => {
    env.OSRM_URL = 'https://osrm.test';
    const fetchFn = mockFetch(async () => ({ ok: true, json: async () => osrmOk }));

    const route = await getRoute(tutor, student);

    expect(route).toMatchObject({ source: 'osrm', distanceKm: 6.24, durationMin: 13 });
    expect(route.path[0]).toEqual([14.5905, -90.5155]);
    expect(route.path).toHaveLength(3);
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('/route/v1/driving/-90.5155,14.5905;-90.5069,14.6349');
  });

  it('cae a línea recta si OSRM responde con error', async () => {
    env.OSRM_URL = 'https://osrm.test';
    mockFetch(async () => ({ ok: false, status: 503 }));

    const route = await getRoute(tutor, student);

    expect(route.source).toBe('straight-line');
    expect(route.durationMin).toBeNull();
    expect(route.path).toEqual([[tutor.lat, tutor.lng], [student.lat, student.lng]]);
    expect(route.distanceKm).toBeGreaterThan(4);
    expect(route.distanceKm).toBeLessThan(6);
  });

  it('cae a línea recta si OSRM no encuentra ruta o falla la red', async () => {
    env.OSRM_URL = 'https://osrm.test';
    mockFetch(async () => ({ ok: true, json: async () => ({ code: 'NoRoute' }) }));
    expect((await getRoute(tutor, student)).source).toBe('straight-line');

    mockFetch(async () => { throw new Error('ECONNREFUSED'); });
    expect((await getRoute(tutor, student)).source).toBe('straight-line');
  });

  it('no consulta OSRM si OSRM_URL está vacío', async () => {
    env.OSRM_URL = '';
    const fetchFn = mockFetch(async () => ({ ok: true, json: async () => osrmOk }));

    expect((await getRoute(tutor, student)).source).toBe('straight-line');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('cotización de traslado', () => {
  it('buildTripPrice desglosa tutoría + traslado', () => {
    expect(buildTripPrice(100, 5, 1.5, 6.24)).toEqual({
      distanceKm: 6.24, baseAmount: 150, transportAmount: 31.2, total: 181.2,
    });
  });

  it('quoteTrip cobra el traslado sobre la distancia real de la ruta', async () => {
    env.OSRM_URL = 'https://osrm.test';
    mockFetch(async () => ({ ok: true, json: async () => osrmOk }));

    const { breakdown, route } = await quoteTrip(100, 5, 1, tutor, student);

    expect(route.source).toBe('osrm');
    expect(breakdown).toEqual({ distanceKm: 6.24, baseAmount: 100, transportAmount: 31.2, total: 131.2 });
  });
});
