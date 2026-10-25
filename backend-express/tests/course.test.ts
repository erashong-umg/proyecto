import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { Category } from '../src/models/Category';
import { Course } from '../src/models/Course';

let app: ReturnType<typeof createApp>;
let categoryId: string;

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  categoryId = (await Category.create({ name: 'Idiomas', slug: 'idiomas' }))._id.toString();
});

// Un tutor que ya completó el onboarding con sus tarifas de perfil.
const tutorConTarifas = async (tarifas: Record<string, unknown> = { baseRate: 120, ratePerKm: 7 }) => {
  const registro = await request(app).post('/api/auth/register').send({
    email: 'tutor@educaspot.gt', password: 'Clave1234', name: 'Tutor', role: 'tutor',
  });
  const token = registro.body.token as string;
  await request(app).put('/api/users/me/onboarding').set('Authorization', `Bearer ${token}`).send({
    phone: '+502 5555-1234', gender: 'F',
    idDocument: { type: 'dpi', number: '2456712340101' },
    address: { street: 'Zona 10', coords: { lat: 14.59, lng: -90.51 } },
    categoryIds: [categoryId],
    bio: 'Profesor', cvUrl: 'https://example.com/cv', ...tarifas,
  });
  return token;
};

const crearCurso = (token: string, extra: Record<string, unknown> = {}) =>
  request(app).post('/api/courses').set('Authorization', `Bearer ${token}`).send({
    categoryId, title: 'Inglés', description: 'Clases', modalities: ['virtual', 'presencial-estudiante'], ...extra,
  });

describe('Cursos: tarifas heredadas del perfil', () => {
  it('sin tarifas en el curso, hereda las del perfil del tutor', async () => {
    const token = await tutorConTarifas({ baseRate: 120, ratePerKm: 7 });

    const res = await crearCurso(token);

    expect(res.status).toBe(201);
    expect(res.body.course).toMatchObject({ baseRate: 120, ratePerKm: 7 });
  });

  it('una tarifa propia del curso tiene prioridad sobre la del perfil', async () => {
    const token = await tutorConTarifas({ baseRate: 120, ratePerKm: 7 });

    const res = await crearCurso(token, { baseRate: 200, ratePerKm: 0 });

    expect(res.body.course).toMatchObject({ baseRate: 200, ratePerKm: 0 });
  });

  it('se puede dar solo la tarifa base y heredar el costo por kilómetro', async () => {
    const token = await tutorConTarifas({ baseRate: 120, ratePerKm: 7 });

    const res = await crearCurso(token, { baseRate: 90 });

    expect(res.body.course).toMatchObject({ baseRate: 90, ratePerKm: 7 });
  });

  it('si no hay tarifa ni en el curso ni en el perfil, pide indicarla', async () => {
    const registro = await request(app).post('/api/auth/register').send({
      email: 'otro@educaspot.gt', password: 'Clave1234', name: 'Otro', role: 'tutor',
    });

    const res = await crearCurso(registro.body.token);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tarifa/i);
    expect(await Course.countDocuments()).toBe(0);
  });
});
