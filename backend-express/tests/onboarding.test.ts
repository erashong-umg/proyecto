import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { User } from '../src/models/User';
import { signToken } from '../src/utils/jwt';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);
  // El índice único del documento tiene que existir antes de probar duplicados.
  await User.init();
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
});

const registrar = async (email: string, role: 'student' | 'tutor' = 'student') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Clave1234', name: 'Usuario Test', role });
  return res.body.token as string;
};

const perfil = {
  phone: '+502 5555-1234',
  gender: 'F',
  address: { street: 'Zona 10', coords: { lat: 14.59, lng: -90.51 } },
  categoryIds: [],
};

const onboarding = (token: string, body: Record<string, unknown>) =>
  request(app).put('/api/users/me/onboarding').set('Authorization', `Bearer ${token}`).send({ ...perfil, ...body });

describe('Documento de identificación en el onboarding', () => {
  it('es obligatorio', async () => {
    const token = await registrar('a@educaspot.gt');

    const res = await onboarding(token, {});

    expect(res.status).toBe(400);
    expect((await User.findOne({ email: 'a@educaspot.gt' }))!.onboardingCompleted).toBe(false);
  });

  it('rechaza un DPI que no tiene 13 dígitos y un pasaporte inválido', async () => {
    const token = await registrar('a@educaspot.gt');

    const dpi = await onboarding(token, { idDocument: { type: 'dpi', number: '123456789012' } });
    expect(dpi.status).toBe(400);
    expect(dpi.body.error).toMatch(/13 dígitos/);

    const letras = await onboarding(token, { idDocument: { type: 'dpi', number: 'ABCDEFGHIJKLM' } });
    expect(letras.status).toBe(400);

    const pasaporte = await onboarding(token, { idDocument: { type: 'pasaporte', number: 'A1' } });
    expect(pasaporte.status).toBe(400);
    expect(pasaporte.body.error).toMatch(/pasaporte/i);

    const tipo = await onboarding(token, { idDocument: { type: 'licencia', number: '1234567890123' } });
    expect(tipo.status).toBe(400);
  });

  it('guarda el DPI normalizado sin espacios ni guiones', async () => {
    const token = await registrar('a@educaspot.gt');

    const res = await onboarding(token, { idDocument: { type: 'dpi', number: '2456 71234-0101' } });

    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
    const guardado = await User.findOne({ email: 'a@educaspot.gt' }).select('+idDocument').lean();
    expect(guardado!.idDocument).toEqual({ type: 'dpi', number: '2456712340101' });
  });

  it('acepta pasaporte alfanumérico en mayúsculas', async () => {
    const token = await registrar('a@educaspot.gt');

    const res = await onboarding(token, { idDocument: { type: 'pasaporte', number: 'ab-123456' } });

    expect(res.status).toBe(200);
    const guardado = await User.findOne({ email: 'a@educaspot.gt' }).select('+idDocument').lean();
    expect(guardado!.idDocument).toEqual({ type: 'pasaporte', number: 'AB123456' });
  });

  it('no se devuelve en la respuesta del onboarding ni en GET /users/me', async () => {
    const token = await registrar('a@educaspot.gt');
    const res = await onboarding(token, { idDocument: { type: 'dpi', number: '2456712340101' } });
    expect(res.body.user.idDocument).toBeUndefined();

    const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.idDocument).toBeUndefined();
    expect(JSON.stringify(me.body)).not.toContain('2456712340101');
  });

  it('no permite el mismo documento en dos cuentas (409)', async () => {
    const tokenA = await registrar('a@educaspot.gt');
    const tokenB = await registrar('b@educaspot.gt');
    const idDocument = { type: 'dpi', number: '2456712340101' };

    expect((await onboarding(tokenA, { idDocument })).status).toBe(200);
    const duplicado = await onboarding(tokenB, { idDocument: { type: 'dpi', number: '2456 71234 0101' } });

    expect(duplicado.status).toBe(409);
    expect((await User.findOne({ email: 'b@educaspot.gt' }))!.onboardingCompleted).toBe(false);
  });
});

describe('Revisión de tutores por el administrador', () => {
  it('el listado de tutores pendientes incluye el documento; el de usuarios no', async () => {
    const tokenTutor = await registrar('tutor@educaspot.gt', 'tutor');
    const res = await onboarding(tokenTutor, {
      idDocument: { type: 'dpi', number: '2456712340101' },
      bio: 'Profesor', cvUrl: 'https://example.com/cv', baseRate: 100, ratePerKm: 5,
    });
    expect(res.status).toBe(200);

    const admin = await User.create({
      email: 'admin@educaspot.gt', password: 'Admin1234', name: 'Admin', role: 'admin', onboardingCompleted: true,
    });
    const tokenAdmin = signToken({ id: admin._id.toString(), email: admin.email, role: 'admin' });

    const pendientes = await request(app).get('/api/admin/tutors/pending').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(pendientes.status).toBe(200);
    expect(pendientes.body.tutors[0].idDocument).toEqual({ type: 'dpi', number: '2456712340101' });

    const usuarios = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(JSON.stringify(usuarios.body)).not.toContain('2456712340101');
  });
});
