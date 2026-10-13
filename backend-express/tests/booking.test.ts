import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { createBooking } from '../src/services/booking.service';
import { Booking } from '../src/models/Booking';
import { User } from '../src/models/User';
import { Category } from '../src/models/Category';
import { Course } from '../src/models/Course';
import { Availability } from '../src/models/Availability';

let tutorId: Types.ObjectId;
let studentId: Types.ObjectId;
let tutor2Id: Types.ObjectId;
let student2Id: Types.ObjectId;
let categoryId: Types.ObjectId;
let courseId: Types.ObjectId;

beforeAll(async () => {
  const testUri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/educaspot-test';
  await mongoose.connect(testUri);

  const cat = await Category.create({ name: 'Idiomas', slug: 'idiomas' });
  categoryId = cat._id;

  // Crear tutor con dirección en zona 10
  const tutor = await User.create({
    email: 't@e.gt',
    password: 'Pass1234',
    name: 'Tutor',
    role: 'tutor',
    status: 'active',
    onboardingCompleted: true,
    address: { street: 'Zona 10', coords: { lat: 14.5905, lng: -90.5155 } },
    tutorData: { bio: '...', cvUrl: 'http://x.com/cv', baseRate: 100, ratePerKm: 5, categories: [categoryId], approved: true },
  });
  tutorId = tutor._id;
  await Availability.create({ tutorId, slots: [{ dayOfWeek: 1, startMinute: 480, endMinute: 1080 }] });

  const tutor2 = await User.create({
    email: 't2@e.gt',
    password: 'Pass1234',
    name: 'Tutor 2',
    role: 'tutor',
    status: 'active',
    onboardingCompleted: true,
    address: { street: 'Zona 14', coords: { lat: 14.5845, lng: -90.5155 } },
    tutorData: { bio: '...', cvUrl: 'http://x.com/cv2', baseRate: 150, ratePerKm: 5, categories: [categoryId], approved: true },
  });
  tutor2Id = tutor2._id;

  // Estudiantes
  const student = await User.create({
    email: 's@e.gt', password: 'Pass1234', name: 'Student', role: 'student', status: 'active', onboardingCompleted: true,
    address: { street: 'Zona 1', coords: { lat: 14.6349, lng: -90.5069 } },
  });
  studentId = student._id;

  const student2 = await User.create({
    email: 's2@e.gt', password: 'Pass1234', name: 'Student 2', role: 'student', status: 'active', onboardingCompleted: true,
    address: { street: 'Mixco', coords: { lat: 14.6333, lng: -90.6067 } },
  });
  student2Id = student2._id;

  // Curso
  const course = await Course.create({
    tutorId, categoryId,
    title: 'Inglés conversacional',
    description: 'Clases de inglés',
    modalities: ['virtual', 'presencial-estudiante'],
    baseRate: 100,
    ratePerKm: 5,
  });
  courseId = course._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Booking.deleteMany({});
});

describe('Booking - anti-traslape', () => {
  // Caso 1: Slot libre, primera reserva, debe funcionar
  it('Caso 1: primera reserva en slot libre funciona', async () => {
    const start = new Date('2026-10-05T10:00:00.000Z');  // lunes 10:00 UTC
    const bookings = await createBooking(studentId, {
      tutorId: tutorId.toString(),
      courseId: courseId.toString(),
      startsAt: start,
      durationMin: 60,
      modality: 'virtual',
    });
    expect(bookings).toHaveLength(1);
  });

  // Caso 2: Traslape con booking del TUTOR → 409
  it('Caso 2: booking del tutor ya tiene el slot → 409', async () => {
    const start = new Date('2026-10-12T10:00:00.000Z');    // siguiente lunes
    await Booking.create({
      studentId: student2Id,
      tutorId,
      courseId,
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      durationMin: 60,
      modality: 'virtual',
      status: 'confirmed',
      priceBreakdown: { baseAmount: 100, total: 100 },
    });

    await expect(
      createBooking(studentId, {
        tutorId: tutorId.toString(),
        courseId: courseId.toString(),
        startsAt: start,
        durationMin: 60,
        modality: 'virtual',
      })
    ).rejects.toThrow();
  });

  // Caso 3: Traslape con booking del ESTUDIANTE → 409
  it('Caso 3: booking del estudiante ya tiene el slot → 409', async () => {
    const start = new Date('2026-10-19T14:00:00.000Z');
    await Booking.create({
      studentId,
      tutorId: tutor2Id,
      courseId,
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      durationMin: 60,
      modality: 'virtual',
      status: 'confirmed',
      priceBreakdown: { baseAmount: 100, total: 100 },
    });

    await expect(
      createBooking(studentId, {
        tutorId: tutorId.toString(),
        courseId: courseId.toString(),
        startsAt: start,
        durationMin: 60,
        modality: 'virtual',
      })
    ).rejects.toThrow();
  });

  // Caso 4: Slots adyacentes (uno termina a las 11:00, el otro empieza a las 11:00) NO chocan
  it('Caso 4: slots adyacentes no se solapan', async () => {
    const start1 = new Date('2026-11-02T10:00:00.000Z');
    const end1 = new Date('2026-11-02T11:00:00.000Z');
    await Booking.create({
      studentId: student2Id,
      tutorId,
      courseId,
      startsAt: start1,
      endsAt: end1,
      durationMin: 60,
      modality: 'virtual',
      status: 'confirmed',
      priceBreakdown: { baseAmount: 100, total: 100 },
    });

    const bookings = await createBooking(studentId, {
      tutorId: tutorId.toString(),
      courseId: courseId.toString(),
      startsAt: end1,                                      // empieza justo cuando termina el otro
      durationMin: 60,
      modality: 'virtual',
    });
    expect(bookings).toHaveLength(1);                     // No debe haber conflicto
  });

  // Caso 5: Repetir 2 semanas → crea 2 bookings
  it('Caso 5: repeatWeeks=2 crea 2 bookings con 7 días de diferencia', async () => {
    const start = new Date('2026-11-09T10:00:00.000Z');
    const bookings = await createBooking(studentId, {
      tutorId: tutorId.toString(),
      courseId: courseId.toString(),
      startsAt: start,
      durationMin: 60,
      modality: 'virtual',
      repeatWeeks: 2,
    });
    expect(bookings).toHaveLength(2);
    expect(bookings[0].startsAt.toISOString()).toBe('2026-11-09T10:00:00.000Z');
    expect(bookings[1].startsAt.toISOString()).toBe('2026-11-16T10:00:00.000Z');
  });
});
