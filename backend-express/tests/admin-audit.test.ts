import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { User } from '../src/models/User';
import { AuditLog } from '../src/models/AuditLog';
import { signToken } from '../src/utils/jwt';

let app: ReturnType<typeof createApp>;
let adminToken: string;

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

  const admin = await User.create({
    email: 'admin@educaspot.gt',
    password: 'Admin1234',
    name: 'Admin Test',
    role: 'admin',
    status: 'active',
    onboardingCompleted: true,
  });
  adminToken = signToken({ id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin', status: 'active' });
});

describe('Auditoría administrativa', () => {
  it('crear una categoría queda registrado en el log de auditoría', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Música', slug: 'musica' });

    expect(res.status).toBe(201);

    const logs = await AuditLog.find({}).lean();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('category.create');
    expect(logs[0].targetType).toBe('Category');
    expect(logs[0].detail).toBe('Música');
    expect(logs[0].adminName).toBe('Admin Test');
  });

  it('suspender y reactivar un usuario queda registrado', async () => {
    const student = await User.create({
      email: 'alumno@educaspot.gt', password: 'Pass1234', name: 'Alumno',
      role: 'student', status: 'active', onboardingCompleted: true,
    });

    await request(app)
      .patch(`/api/admin/users/${student._id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Conducta inapropiada' })
      .expect(200);

    await request(app)
      .patch(`/api/admin/users/${student._id}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const logs = await AuditLog.find({}).sort({ createdAt: 1 }).lean();
    expect(logs.map((l) => l.action)).toEqual(['user.suspend', 'user.reactivate']);
    expect(logs[0].detail).toBe('Conducta inapropiada');
  });

  it('GET /api/admin/audit-logs solo es accesible para administradores, y lista lo más reciente primero', async () => {
    const student = await User.create({
      email: 'otro@educaspot.gt', password: 'Pass1234', name: 'Otro',
      role: 'student', status: 'active', onboardingCompleted: true,
    });
    const studentToken = signToken({ id: student._id.toString(), email: student.email, name: student.name, role: 'student', status: 'active' });

    await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);

    await request(app).post('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Arte', slug: 'arte' });
    await request(app).post('/api/admin/categories').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Danza', slug: 'danza' });

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.logs).toHaveLength(2);
    expect(res.body.logs[0].detail).toBe('Danza');   // más reciente primero
    expect(res.body.logs[1].detail).toBe('Arte');
  });
});
