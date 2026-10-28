import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from './test-helpers';
import { User } from '../src/models/User';
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
    email: 'admin@educaspot.gt', password: 'Admin1234', name: 'Admin Test',
    role: 'admin', status: 'active', onboardingCompleted: true,
  });
  adminToken = signToken({ id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin', status: 'active' });
});

describe('GET /api/admin/analytics — ranking de tutores', () => {
  it('incluye tanto el ranking de mejor como el de peor calificados', async () => {
    await User.create({
      email: 'bueno@educaspot.gt', password: 'Pass1234', name: 'Tutor Bueno', role: 'tutor', status: 'active',
      onboardingCompleted: true,
      tutorData: { bio: '...', cvUrl: 'http://x.com/cv', baseRate: 100, ratePerKm: 5, categories: [], avgRating: 4.9, reviewCount: 10, approved: true },
    });
    await User.create({
      email: 'malo@educaspot.gt', password: 'Pass1234', name: 'Tutor Malo', role: 'tutor', status: 'active',
      onboardingCompleted: true,
      tutorData: { bio: '...', cvUrl: 'http://x.com/cv2', baseRate: 100, ratePerKm: 5, categories: [], avgRating: 1.5, reviewCount: 8, approved: true },
    });

    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.topTutors[0].name).toBe('Tutor Bueno');
    expect(res.body.bottomTutors[0].name).toBe('Tutor Malo');
  });
});
