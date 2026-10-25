import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { env } from '../src/config/env';
import { User } from '../src/models/User';
import { Unauthorized } from '../src/utils/errors';
import { verifyGoogleCredential, type GoogleProfile } from '../src/services/google.service';

// La verificación real contra Google necesita un ID token válido; aquí se
// simula el servicio y se prueba toda la lógica de cuentas alrededor.
vi.mock('../src/services/google.service', () => ({ verifyGoogleCredential: vi.fn() }));
const verify = vi.mocked(verifyGoogleCredential);

let app: ReturnType<typeof createApp>;
const originalClientId = env.GOOGLE_CLIENT_ID;

const perfil: GoogleProfile = {
  googleId: 'google-sub-123',
  email: 'ana@gmail.com',
  name: 'Ana Google',
  photoUrl: 'https://lh3.googleusercontent.com/ana.jpg',
};
const CREDENTIAL = 'x'.repeat(40);

const loginGoogle = (body: Record<string, unknown> = {}) =>
  request(app).post('/api/auth/google').send({ credential: CREDENTIAL, ...body });

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  await User.init();
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  env.GOOGLE_CLIENT_ID = 'cliente-de-prueba.apps.googleusercontent.com';
  verify.mockReset();
  verify.mockResolvedValue(perfil);
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterEach(() => {
  env.GOOGLE_CLIENT_ID = originalClientId;
});

describe('POST /api/auth/google', () => {
  it('responde 503 si no hay GOOGLE_CLIENT_ID configurado', async () => {
    env.GOOGLE_CLIENT_ID = '';

    const res = await loginGoogle();

    expect(res.status).toBe(503);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rechaza una credencial ausente o demasiado corta', async () => {
    expect((await request(app).post('/api/auth/google').send({})).status).toBe(400);
    expect((await loginGoogle({ credential: 'abc' })).status).toBe(400);
  });

  it('crea la cuenta con nombre, correo y foto de Google, y devuelve un JWT válido', async () => {
    const res = await loginGoogle();

    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.user).toMatchObject({ email: 'ana@gmail.com', name: 'Ana Google', role: 'student' });

    const guardado = await User.findOne({ email: 'ana@gmail.com' }).select('+password');
    expect(guardado).toMatchObject({ googleId: 'google-sub-123', photoUrl: perfil.photoUrl, onboardingCompleted: false });
    expect(guardado!.password).toBeUndefined();

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('ana@gmail.com');
  });

  it('respeta el rol elegido al crear la cuenta (registro como tutor)', async () => {
    const res = await loginGoogle({ role: 'tutor' });

    expect(res.body.user.role).toBe('tutor');
  });

  it('un segundo ingreso reutiliza la cuenta y no la marca como nueva', async () => {
    await loginGoogle();
    const res = await loginGoogle({ role: 'tutor' });

    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(false);
    expect(res.body.user.role).toBe('student');
    expect(await User.countDocuments()).toBe(1);
  });

  it('vincula una cuenta existente con el mismo correo y conserva su contraseña', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'ana@gmail.com', password: 'Clave1234', name: 'Ana Local', role: 'student',
    });

    const res = await loginGoogle();

    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(false);
    expect(await User.countDocuments()).toBe(1);
    const vinculada = await User.findOne({ email: 'ana@gmail.com' });
    expect(vinculada).toMatchObject({ googleId: 'google-sub-123', name: 'Ana Local', photoUrl: perfil.photoUrl });

    const conClave = await request(app).post('/api/auth/login').send({ email: 'ana@gmail.com', password: 'Clave1234' });
    expect(conClave.status).toBe(200);
  });

  it('una cuenta creada con Google no puede entrar con contraseña', async () => {
    await loginGoogle();

    const res = await request(app).post('/api/auth/login').send({ email: 'ana@gmail.com', password: 'Clave1234' });

    expect(res.status).toBe(401);
  });

  it('no permite que un correo ya vinculado a un Google se asocie a otro', async () => {
    await loginGoogle();
    verify.mockResolvedValue({ ...perfil, googleId: 'otro-google-sub' });

    const res = await loginGoogle();

    expect(res.status).toBe(409);
  });

  it('no inicia sesión a administradores por este medio', async () => {
    await User.create({
      email: 'ana@gmail.com', password: 'Admin1234', name: 'Admin', role: 'admin', onboardingCompleted: true,
    });

    const res = await loginGoogle();

    expect(res.status).toBe(403);
    expect((await User.findOne({ email: 'ana@gmail.com' }))!.googleId).toBeUndefined();
  });

  it('devuelve 401 si Google no valida la credencial y no crea ninguna cuenta', async () => {
    verify.mockRejectedValue(Unauthorized('No se pudo verificar la cuenta de Google. Intente de nuevo.'));

    const res = await loginGoogle();

    expect(res.status).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });
});
