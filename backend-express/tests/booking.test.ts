import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { createBooking, cancelBooking, getFreeSlots, syncCompletedBookings } from '../src/services/booking.service';
import { dateKeyOf, dayOfWeekOfKey, zonedTimeToUtc } from '../src/utils/time';
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

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

// El tutor de prueba atiende los lunes de 08:00 a 18:00 (hora de la academia). Las
// fechas se calculan hacia adelante: no se puede reservar en el pasado.
const lunes = (semanasAdelante: number, minutoLocal: number): Date => {
  const base = Date.now() + 2 * DIA;
  for (let i = 0; i < 7; i++) {
    const key = dateKeyOf(new Date(base + i * DIA));
    if (dayOfWeekOfKey(key) === 1) {
      return new Date(zonedTimeToUtc(key, minutoLocal).getTime() + semanasAdelante * 7 * DIA);
    }
  }
  throw new Error('sin lunes');
};
const DIEZ = 10 * 60;   // 10:00 locales

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
    const start = lunes(0, DIEZ);
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
    const start = lunes(1, DIEZ);
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
    const start = lunes(2, 14 * 60);
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
    const start1 = lunes(3, DIEZ);
    const end1 = new Date(start1.getTime() + HORA);
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
  it('Caso 5: repeatWeeks=4 crea 4 bookings con 7 días de diferencia', async () => {
    const start = lunes(5, DIEZ);
    const bookings = await createBooking(studentId, {
      tutorId: tutorId.toString(),
      courseId: courseId.toString(),
      startsAt: start,
      durationMin: 60,
      modality: 'virtual',
      repeatWeeks: 4,
    });
    expect(bookings).toHaveLength(4);
    expect(bookings[0].startsAt.toISOString()).toBe(start.toISOString());
    expect(bookings[1].startsAt.getTime() - bookings[0].startsAt.getTime()).toBe(7 * DIA);
    expect(bookings[3].startsAt.getTime() - bookings[0].startsAt.getTime()).toBe(21 * DIA);
  });
});


const reservar = (extra: Record<string, unknown> = {}) =>
  createBooking(studentId, {
    tutorId: tutorId.toString(),
    courseId: courseId.toString(),
    startsAt: lunes(0, DIEZ),
    durationMin: 60,
    modality: 'virtual',
    ...extra,
  } as Parameters<typeof createBooking>[1]);

const ocupar = (startsAt: Date, extra: Record<string, unknown> = {}) =>
  Booking.create({
    studentId: student2Id,
    tutorId,
    courseId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + HORA),
    durationMin: 60,
    modality: 'virtual',
    status: 'confirmed',
    priceBreakdown: { baseAmount: 100, total: 100 },
    ...extra,
  });

describe('Booking - reglas de agenda', () => {
  it('la disponibilidad del tutor también aplica a las clases virtuales', async () => {
    await expect(reservar({ startsAt: lunes(0, 6 * 60) })).rejects.toThrow(/disponibilidad/);   // 06:00, antes de su horario
    await expect(reservar({ startsAt: new Date(lunes(0, DIEZ).getTime() + DIA) })).rejects.toThrow(/disponibilidad/);   // martes
    expect(await reservar()).toHaveLength(1);
  });

  it('interpreta el horario en la hora de la academia, no en la del servidor', () => {
    // 10:00 en Guatemala (UTC-6, sin horario de verano) son las 16:00 UTC.
    expect(zonedTimeToUtc('2026-11-09', DIEZ).toISOString()).toBe('2026-11-09T16:00:00.000Z');
  });

  it('no permite reservar en el pasado', async () => {
    await expect(reservar({ startsAt: lunes(-4, DIEZ) })).rejects.toThrow(/pasado/);
  });

  it('la suscripción es de 4 u 8 semanas (o una sola vez)', async () => {
    await expect(reservar({ repeatWeeks: 2 })).rejects.toThrow(/4 u 8 semanas/);
    await expect(reservar({ repeatWeeks: 12 })).rejects.toThrow(/4 u 8 semanas/);
    expect(await reservar({ repeatWeeks: 8, startsAt: lunes(6, DIEZ) })).toHaveLength(8);
  });

  it('no se puede cancelar una tutoría que ya comenzó, pero sí una futura', async () => {
    const empezada = await ocupar(new Date(Date.now() - 30 * 60 * 1000));
    await expect(cancelBooking(student2Id, empezada._id.toString())).rejects.toThrow(/ya comenzó/);

    const futura = await ocupar(lunes(4, DIEZ));
    expect((await cancelBooking(student2Id, futura._id.toString())).status).toBe('cancelled');
  });
});

describe('Booking - sesiones que se completan solas', () => {
  it('una tutoría confirmada cuyo horario terminó pasa a completada', async () => {
    const terminada = await ocupar(new Date(Date.now() - 3 * HORA));
    const enCurso = await ocupar(new Date(Date.now() - 30 * 60 * 1000));
    const futura = await ocupar(lunes(1, DIEZ));
    const cancelada = await ocupar(new Date(Date.now() - 5 * HORA), { status: 'cancelled' });

    await syncCompletedBookings({ tutorId });

    const estado = async (b: { _id: Types.ObjectId }) => (await Booking.findById(b._id))!.status;
    expect(await estado(terminada)).toBe('completed');
    expect(await estado(enCurso)).toBe('confirmed');      // todavía no termina
    expect(await estado(futura)).toBe('confirmed');
    expect(await estado(cancelada)).toBe('cancelled');    // no se resucita
  });
});

describe('Booking - horarios libres (getFreeSlots)', () => {
  const fecha = () => dateKeyOf(lunes(1, DIEZ));
  const libres = async (extra: Record<string, unknown> = {}) =>
    (await getFreeSlots({ tutorId: tutorId.toString(), studentId, date: fecha(), durationMin: 60, ...extra })).map((x) => x.label);

  it('ofrece todos los inicios posibles dentro del horario del tutor', async () => {
    const labels = await libres();
    expect(labels[0]).toBe('08:00');
    expect(labels[labels.length - 1]).toBe('17:00');     // 17:00 + 60 min = 18:00, el fin de su horario
    expect(labels).toHaveLength(19);                      // cada 30 minutos
  });

  it('devuelve el instante UTC listo para reservar', async () => {
    const [primero] = await getFreeSlots({ tutorId: tutorId.toString(), studentId, date: fecha(), durationMin: 60 });
    expect(primero.startsAt).toBe(zonedTimeToUtc(fecha(), 8 * 60).toISOString());
  });

  it('descuenta lo que ya tiene reservado el tutor', async () => {
    await ocupar(lunes(1, DIEZ));                         // 10:00–11:00
    const labels = await libres();
    expect(labels).not.toContain('09:30');                // chocaría: 09:30–10:30
    expect(labels).not.toContain('10:00');
    expect(labels).not.toContain('10:30');
    expect(labels).toContain('09:00');                    // 09:00–10:00 termina justo antes
    expect(labels).toContain('11:00');
  });

  it('descuenta lo que el propio estudiante ya tiene con otro tutor', async () => {
    await Booking.create({
      studentId, tutorId: tutor2Id, courseId,
      startsAt: lunes(1, 14 * 60), endsAt: new Date(lunes(1, 14 * 60).getTime() + HORA),
      durationMin: 60, modality: 'virtual', status: 'confirmed', priceBreakdown: { baseAmount: 100, total: 100 },
    });
    expect(await libres()).not.toContain('14:00');
  });

  it('en una suscripción solo ofrece horas libres todas las semanas', async () => {
    await ocupar(lunes(3, DIEZ));                         // la 3.ª semana (contando desde lunes(1)) a las 10:00 ya está ocupada
    expect(await libres({ repeatWeeks: 1 })).toContain('10:00');
    expect(await libres({ repeatWeeks: 4 })).not.toContain('10:00');
    expect(await libres({ repeatWeeks: 4 })).toContain('11:00');
  });

  it('un día sin horario publicado no tiene opciones', async () => {
    const martes = dateKeyOf(new Date(lunes(1, DIEZ).getTime() + DIA));
    expect(await getFreeSlots({ tutorId: tutorId.toString(), studentId, date: martes, durationMin: 60 })).toEqual([]);
  });

  it('valida la fecha, la duración y la repetición', async () => {
    const base = { tutorId: tutorId.toString(), studentId, durationMin: 60 };
    await expect(getFreeSlots({ ...base, date: '09/11/2026' })).rejects.toThrow(/AAAA-MM-DD/);
    await expect(getFreeSlots({ ...base, date: fecha(), durationMin: 5 })).rejects.toThrow(/duración/);
    await expect(getFreeSlots({ ...base, date: fecha(), repeatWeeks: 3 })).rejects.toThrow(/4 u 8 semanas/);
  });
});
