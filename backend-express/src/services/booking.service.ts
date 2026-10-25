import { Types } from 'mongoose';
import { Booking, type IBooking } from '../models/Booking';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { quoteTrip, type LatLng } from './geo.service';
import { Conflict, BadRequest, NotFound } from '../utils/errors';
import type { Modality } from '../models/Course';
import { Availability } from '../models/Availability';
import { dayOfWeekOfKey, formatHHMM, isDateKey, zonedParts, zonedTimeToUtc } from '../utils/time';

// Una sola vez, o suscripción semanal de 4 u 8 semanas.
export const REPEAT_OPTIONS = [1, 4, 8];

export interface CreateBookingInput {
  tutorId: string;
  courseId: string;
  startsAt: Date;
  durationMin: number;
  modality: Modality;
  /** Repeticiones semanales (D2 del plan: crea N bookings idénticos con +7 días cada uno) */
  repeatWeeks?: number;
}

/**
 * Verifica que el slot cae dentro de la disponibilidad del tutor.
 */
const tutorIsAvailable = (availability: { slots: { dayOfWeek: number; startMinute: number; endMinute: number }[] }, startsAt: Date, endsAt: Date): boolean => {
  // Hora local de la academia (no la del servidor, que en Docker es UTC).
  const start = zonedParts(startsAt);
  const startMin = start.minuteOfDay;
  const endMin = startMin + Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
  const dow = start.dayOfWeek;                // 0=Dom, 6=Sáb

  return availability.slots.some(
    (slot) =>
      slot.dayOfWeek === dow &&
      slot.startMinute <= startMin &&
      slot.endMinute >= endMin
  );
};

/**
 * Verifica que no hay booking solapado para el tutor o el estudiante.
 * Solapamiento: dos intervalos [s1,e1) y [s2,e2) se solapan si s1 < e2 && s2 < e1.
 */
const hasOverlap = async (
  userId: Types.ObjectId,
  role: 'tutor' | 'student',
  startsAt: Date,
  endsAt: Date,
  excludeBookingId?: Types.ObjectId
): Promise<boolean> => {
  const filter: Record<string, unknown> = {
    status: { $in: ['pending', 'confirmed'] },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
  };
  filter[role === 'tutor' ? 'tutorId' : 'studentId'] = userId;
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const overlap = await Booking.findOne(filter).lean();
  return !!overlap;
};

/**
 * Crea un booking (o N bookings si se pidió repetición).
 * Valida: disponibilidad del tutor, anti-traslape tutor, anti-traslape estudiante.
 */
export const createBooking = async (
  studentId: Types.ObjectId,
  input: CreateBookingInput
): Promise<IBooking[]> => {
  const { tutorId, courseId, startsAt, durationMin, modality, repeatWeeks = 1 } = input;

  if (durationMin < 15) throw BadRequest('La duración mínima es 15 minutos.');
  if (!REPEAT_OPTIONS.includes(repeatWeeks)) {
    throw BadRequest('La suscripción periódica es de 4 u 8 semanas (o una sola vez).');
  }
  if (startsAt.getTime() <= Date.now()) throw BadRequest('No se puede reservar en el pasado.');

  const tutor = await User.findById(tutorId).select('role tutorData address').lean();
  if (!tutor || tutor.role !== 'tutor') throw NotFound('Tutor no encontrado.');
  if (!tutor.tutorData?.approved) throw BadRequest('El tutor aún no está aprobado.');

  const student = await User.findById(studentId).select('address').lean();
  if (!student?.address?.coords) throw BadRequest('Debe completar su dirección (onboarding) antes de reservar.');

  const course = await Course.findById(courseId).lean();
  if (!course || !course.active) throw NotFound('Curso no encontrado o inactivo.');
  if (!course.modalities.includes(modality)) {
    throw BadRequest(`El curso no admite la modalidad "${modality}".`);
  }

  // Calcular precio
  let priceBreakdown;
  if (modality === 'presencial-estudiante') {
    if (!tutor.address?.coords) throw BadRequest('El tutor no tiene dirección registrada.');
    if (!tutor.tutorData) throw BadRequest('Datos del tutor incompletos.');

    ({ breakdown: priceBreakdown } = await quoteTrip(
      course.baseRate,
      course.ratePerKm,
      durationMin / 60,
      tutor.address.coords as LatLng,
      student.address.coords as LatLng
    ));
  } else {
    const baseAmount = Math.round((course.baseRate * durationMin / 60) * 100) / 100;
    priceBreakdown = { distanceKm: undefined, baseAmount, transportAmount: 0, total: baseAmount };
  }

  // Disponibilidad del tutor: una sola regla para todas las modalidades (también
  // las virtuales se reservan dentro de los horarios que el tutor publicó).
  const availability = await Availability.findOne({ tutorId }).lean();
  const firstEnd = new Date(startsAt.getTime() + durationMin * 60 * 1000);
  if (!availability || !tutorIsAvailable(availability, startsAt, firstEnd)) {
    throw BadRequest('El horario seleccionado no está dentro de la disponibilidad del tutor.');
  }

  // Generar N bookings (1 por semana)
  const bookings: IBooking[] = [];
  const recurringGroupId = repeatWeeks > 1 ? new Types.ObjectId().toString() : undefined;

  for (let i = 0; i < repeatWeeks; i++) {
    const slotStart = new Date(startsAt.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);

    // Anti-traslape del tutor
    if (await hasOverlap(new Types.ObjectId(tutorId), 'tutor', slotStart, slotEnd)) {
      throw Conflict(`El tutor ya tiene una tutoría en la semana ${i + 1} (${slotStart.toISOString()}).`);
    }

    // Anti-traslape del estudiante
    if (await hasOverlap(studentId, 'student', slotStart, slotEnd)) {
      throw Conflict(`Usted ya tiene una tutoría en la semana ${i + 1} (${slotStart.toISOString()}).`);
    }

    const created = await Booking.create({
      studentId,
      tutorId: new Types.ObjectId(tutorId),
      courseId: new Types.ObjectId(courseId),
      startsAt: slotStart,
      endsAt: slotEnd,
      durationMin,
      modality,
      status: 'confirmed',
      priceBreakdown,
      recurringGroupId,
    });
    bookings.push(created);
  }

  return bookings;
};

export const cancelBooking = async (userId: Types.ObjectId, bookingId: string): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw NotFound('Reserva no encontrada.');

  const isOwner = booking.studentId.equals(userId) || booking.tutorId.equals(userId);
  if (!isOwner) throw NotFound('Reserva no encontrada.');

  if (booking.status === 'cancelled') return booking;
  if (booking.status === 'completed') throw BadRequest('No se puede cancelar una tutoría ya completada.');
  if (booking.startsAt.getTime() <= Date.now()) throw BadRequest('La tutoría ya comenzó y no se puede cancelar.');

  booking.status = 'cancelled';
  await booking.save();
  return booking;
};

/**
 * Las tutorías se completan solas: una reserva confirmada cuyo horario ya terminó
 * pasa a "completada" (no hay botón manual). Se aplica al consultar las reservas y
 * antes de calificar, sin tarea programada.
 */
export const syncCompletedBookings = async (filter: Record<string, unknown> = {}): Promise<void> => {
  await Booking.updateMany(
    { ...filter, status: 'confirmed', endsAt: { $lt: new Date() } },
    { $set: { status: 'completed' } }
  );
};

export interface FreeSlot {
  startsAt: string;   // ISO UTC: lo que se envía al reservar
  label: string;      // "09:30" en hora de la academia: lo que se muestra
}

const SLOT_STEP_MIN = 30;

/**
 * Horas de inicio posibles de un tutor en una fecha: dentro de sus horarios
 * publicados, sin chocar con otras tutorías del tutor ni del estudiante, y — si es
 * una suscripción de 4 u 8 semanas — libres todas las semanas. Así el estudiante
 * solo ve opciones que de verdad se pueden reservar.
 */
export const getFreeSlots = async (input: {
  tutorId: string;
  studentId: Types.ObjectId;
  date: string;          // "YYYY-MM-DD" (fecha local de la academia)
  durationMin: number;
  repeatWeeks?: number;
}): Promise<FreeSlot[]> => {
  const { tutorId, studentId, date, durationMin, repeatWeeks = 1 } = input;

  if (!isDateKey(date)) throw BadRequest('La fecha debe tener el formato AAAA-MM-DD.');
  if (!Number.isInteger(durationMin) || durationMin < 15 || durationMin > 240) {
    throw BadRequest('La duración debe estar entre 15 y 240 minutos.');
  }
  if (!REPEAT_OPTIONS.includes(repeatWeeks)) {
    throw BadRequest('La suscripción periódica es de 4 u 8 semanas (o una sola vez).');
  }

  const availability = await Availability.findOne({ tutorId }).lean();
  if (!availability) return [];

  const dow = dayOfWeekOfKey(date);
  const candidates: Date[] = [];
  for (const slot of availability.slots.filter((s) => s.dayOfWeek === dow)) {
    for (let m = slot.startMinute; m + durationMin <= slot.endMinute; m += SLOT_STEP_MIN) {
      candidates.push(zonedTimeToUtc(date, m));
    }
  }

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const durationMs = durationMin * 60 * 1000;
  const now = Date.now();
  const future = candidates.filter((c) => c.getTime() > now);
  if (future.length === 0) return [];

  // Una sola consulta con todo lo que pueda chocar, y los cruces se calculan en memoria.
  const rangeStart = new Date(Math.min(...future.map((c) => c.getTime())));
  const rangeEnd = new Date(Math.max(...future.map((c) => c.getTime())) + (repeatWeeks - 1) * WEEK_MS + durationMs);
  const busy = await Booking.find({
    status: { $in: ['pending', 'confirmed'] },
    startsAt: { $lt: rangeEnd },
    endsAt: { $gt: rangeStart },
    $or: [{ tutorId: new Types.ObjectId(tutorId) }, { studentId }],
  }).select('startsAt endsAt').lean();

  const isFree = (start: number): boolean => {
    for (let w = 0; w < repeatWeeks; w++) {
      const s = start + w * WEEK_MS;
      const e = s + durationMs;
      if (busy.some((b) => b.startsAt.getTime() < e && b.endsAt.getTime() > s)) return false;
    }
    return true;
  };

  return future
    .filter((c) => isFree(c.getTime()))
    .map((c) => ({ startsAt: c.toISOString(), label: formatHHMM(zonedParts(c).minuteOfDay) }));
};
