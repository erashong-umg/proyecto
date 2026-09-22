import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  // Conectar a una DB de test separada
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Limpiar la colección de usuarios entre tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth', () => {
  it('POST /api/auth/register crea un usuario y devuelve cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@educaspot.gt',
        password: 'Clave1234',
        name: 'Usuario Test',
        role: 'student',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@educaspot.gt');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/educaspot_token=/);
  });

  it('POST /api/auth/login con credenciales correctas', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@educaspot.gt',
      password: 'Clave1234',
      name: 'Test Login',
      role: 'student',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@educaspot.gt', password: 'Clave1234' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@educaspot.gt');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login con password incorrecto falla con 401', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'wrong@educaspot.gt',
      password: 'Clave1234',
      name: 'Test Wrong',
      role: 'student',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@educaspot.gt', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrectos/i);
  });

  it('GET /api/auth/me sin token falla con 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me con cookie devuelve usuario', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'me@educaspot.gt',
      password: 'Clave1234',
      name: 'Test Me',
      role: 'student',
    });

    const cookie = reg.headers['set-cookie'][0].split(';')[0];

    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@educaspot.gt');
  });
});
