import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { Category } from '../src/models/Category';
import { Course } from '../src/models/Course';
import { User } from '../src/models/User';

let app: ReturnType<typeof createApp>;
let categoryId: string;
let otraCategoriaId: string;

// La estudiante busca desde Zona 1. Distancias en línea recta aproximadas:
// Ana ≈ 5.0 km, Carla ≈ 5.7 km, Beto ≈ 10.7 km.
const ESTUDIANTE = { studentLat: 14.6349, studentLng: -90.5069 };

type Modalidad = 'virtual' | 'presencial-tutor' | 'presencial-estudiante';

const crearTutor = async (
  name: string,
  coords: { lat: number; lng: number },
  tutorData: { baseRate: number; avgRating: number; reviewCount: number; approved?: boolean },
  modalities: Modalidad[]
) => {
  const tutor = await User.create({
    email: `${name.toLowerCase()}@educaspot.gt`, password: 'Pass1234', name, role: 'tutor', status: 'active', onboardingCompleted: true,
    address: { street: name, coords },
    tutorData: {
      bio: 'bio', cvUrl: 'https://example.com/cv', ratePerKm: 5, categories: [categoryId],
      approved: tutorData.approved ?? true, baseRate: tutorData.baseRate, avgRating: tutorData.avgRating, reviewCount: tutorData.reviewCount,
    },
  });
  await Course.create({
    tutorId: tutor._id, categoryId, title: `Curso de ${name}`, description: 'd', modalities,
    baseRate: tutorData.baseRate, ratePerKm: 5, active: true,
  });
  return tutor;
};

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  for (const key in mongoose.connection.collections) await mongoose.connection.collections[key].deleteMany({});
  categoryId = (await Category.create({ name: 'Idiomas', slug: 'idiomas' }))._id.toString();
  otraCategoriaId = (await Category.create({ name: 'Deportes', slug: 'deportes' }))._id.toString();

  await crearTutor('Ana', { lat: 14.5905, lng: -90.5155 }, { baseRate: 100, avgRating: 4.8, reviewCount: 12 }, ['virtual', 'presencial-estudiante']);
  await crearTutor('Carla', { lat: 14.5845, lng: -90.5155 }, { baseRate: 150, avgRating: 4.2, reviewCount: 5 }, ['virtual']);
  // El curso virtual de Beto está inactivo: no cuenta para la modalidad virtual.
  const beto = await crearTutor('Beto', { lat: 14.6333, lng: -90.6067 }, { baseRate: 200, avgRating: 3.5, reviewCount: 2 }, ['presencial-tutor']);
  await Course.create({ tutorId: beto._id, categoryId, title: 'Virtual viejo', description: 'd', modalities: ['virtual'], baseRate: 200, ratePerKm: 0, active: false });
  await crearTutor('Pendiente', { lat: 14.63, lng: -90.51 }, { baseRate: 90, avgRating: 5, reviewCount: 30, approved: false }, ['virtual']);

  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const buscar = async (query: Record<string, string | number> = {}) => {
  const res = await request(app).get('/api/tutors/search').query({ ...ESTUDIANTE, ...query });
  return { status: res.status, body: res.body, nombres: ((res.body.tutors ?? []) as { name: string }[]).map((t) => t.name) };
};

describe('Búsqueda de tutores: filtros del enunciado', () => {
  it('sin filtros devuelve solo tutores aprobados, ordenados por cercanía y con su distancia', async () => {
    const { nombres, body } = await buscar();

    expect(nombres).toEqual(['Ana', 'Carla', 'Beto']);          // "Pendiente" no aparece
    expect(body.tutors[0].distanceKm).toBeGreaterThan(4);
    expect(body.tutors[0].distanceKm).toBeLessThan(6);
  });

  it('radio de cercanía', async () => {
    expect((await buscar({ radiusKm: 6 })).nombres).toEqual(['Ana', 'Carla']);
    expect((await buscar({ radiusKm: 5.3 })).nombres).toEqual(['Ana']);
    expect((await buscar({ radiusKm: 3 })).nombres).toEqual([]);
  });

  it('calificación mínima (llega como texto en la URL y debe compararse como número)', async () => {
    expect((await buscar({ minRating: 4 })).nombres).toEqual(['Ana', 'Carla']);
    expect((await buscar({ minRating: 4.5 })).nombres).toEqual(['Ana']);
    expect((await buscar({ minRating: 5 })).nombres).toEqual([]);
  });

  it('cantidad mínima de reseñas', async () => {
    expect((await buscar({ minReviews: 5 })).nombres).toEqual(['Ana', 'Carla']);
    expect((await buscar({ minReviews: 10 })).nombres).toEqual(['Ana']);
  });

  it('rango de precio por hora', async () => {
    expect((await buscar({ minPrice: 120 })).nombres).toEqual(['Carla', 'Beto']);
    expect((await buscar({ maxPrice: 150 })).nombres).toEqual(['Ana', 'Carla']);
    expect((await buscar({ minPrice: 120, maxPrice: 160 })).nombres).toEqual(['Carla']);
  });

  it('modalidad: solo tutores con un curso ACTIVO en esa modalidad', async () => {
    expect((await buscar({ modality: 'virtual' })).nombres).toEqual(['Ana', 'Carla']);   // el virtual de Beto está inactivo
    expect((await buscar({ modality: 'presencial-tutor' })).nombres).toEqual(['Beto']);
    expect((await buscar({ modality: 'presencial-estudiante' })).nombres).toEqual(['Ana']);
  });

  it('categoría', async () => {
    expect((await buscar({ categoryId })).nombres).toEqual(['Ana', 'Carla', 'Beto']);
    expect((await buscar({ categoryId: otraCategoriaId })).nombres).toEqual([]);
  });

  it('varios filtros a la vez se combinan', async () => {
    const r = await buscar({ radiusKm: 11, minRating: 4, modality: 'presencial-estudiante', maxPrice: 120, minReviews: 10 });
    expect(r.nombres).toEqual(['Ana']);
  });

  it('el límite se aplica después de ordenar por cercanía', async () => {
    expect((await buscar({ limit: 1 })).nombres).toEqual(['Ana']);
    expect((await buscar({ limit: 2 })).nombres).toEqual(['Ana', 'Carla']);
  });

  it('sin ubicación también filtra (sin distancia)', async () => {
    const res = await request(app).get('/api/tutors/search').query({ minRating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.tutors.map((t: { name: string }) => t.name).sort()).toEqual(['Ana', 'Carla']);
    expect(res.body.tutors[0].distanceKm).toBeUndefined();
  });

  it('rechaza parámetros inválidos con 400', async () => {
    expect((await buscar({ minRating: 9 })).status).toBe(400);
    expect((await buscar({ radiusKm: -2 })).status).toBe(400);
    expect((await buscar({ studentLat: 'abc' })).status).toBe(400);
    expect((await buscar({ modality: 'telepatia' })).status).toBe(400);
    expect((await buscar({ categoryId: 'no-es-un-id' })).status).toBe(400);
    expect((await buscar({ minPrice: 300, maxPrice: 100 })).status).toBe(400);
  });
});
