import { Types } from 'mongoose';
import { Booking, type IBooking } from '../models/Booking';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { calculateTripPrice, type LatLng } from './geo.service';
import { Conflict, BadRequest, NotFound } from '../utils/errors';
import type { Modality } from '../models/Course';
import { Availability } from '../models/Availability';

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
  const startMin = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMin = endsAt.getHours() * 60 + endsAt.getMinutes();
  const dow = startsAt.getDay();              // 0=Dom, 6=Sáb

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
  if (repeatWeeks < 1 || repeatWeeks > 12) throw BadRequest('Las repeticiones deben estar entre 1 y 12.');

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

    priceBreakdown = calculateTripPrice(
      course.baseRate,
      course.ratePerKm,
      durationMin / 60,
      tutor.address.coords as LatLng,
      student.address.coords as LatLng
    );
  } else {
    const baseAmount = Math.round((course.baseRate * durationMin / 60) * 100) / 100;
    priceBreakdown = { distanceKm: undefined, baseAmount, transportAmount: 0, total: baseAmount };
  }

  // Disponibilidad del tutor (solo si no es virtual)
  const availability = await Availability.findOne({ tutorId }).lean();
  if (availability && modality !== 'virtual') {
    const endsAt = new Date(startsAt.getTime() + durationMin * 60 * 1000);
    if (!tutorIsAvailable(availability, startsAt, endsAt)) {
      throw BadRequest('El horario seleccionado no está dentro de la disponibilidad del tutor.');
    }
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

  booking.status = 'cancelled';
  await booking.save();
  return booking;
};

export const completeBooking = async (userId: Types.ObjectId, bookingId: string): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw NotFound('Reserva no encontrada.');

  // Solo el tutor o el estudiante dueño pueden marcarla como completed
  const isOwner = booking.studentId.equals(userId) || booking.tutorId.equals(userId);
  if (!isOwner) throw NotFound('Reserva no encontrada.');

  booking.status = 'completed';
  await booking.save();
  return booking;
};
