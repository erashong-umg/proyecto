import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { createBooking, cancelBooking, completeBooking } from '../services/booking.service';
import { Unauthorized } from '../utils/errors';

export const createBookingController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'student') throw Unauthorized('Solo los estudiantes pueden reservar.');
    // req.body llega de JSON: startsAt es un string ISO, hay que convertirlo a Date
    // antes de pasarlo al servicio (que asume Date y llama .getTime() sobre él).
    const bookings = await createBooking(new Types.ObjectId(req.user.id), {
      ...req.body,
      startsAt: new Date(req.body.startsAt),
    });
    res.status(201).json({ bookings });
  } catch (error) { next(error); }
};

export const getMyBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const bookings = await Booking.find({
      $or: [{ studentId: req.user.id }, { tutorId: req.user.id }],
    })
      .sort({ startsAt: 1 })
      .populate('tutorId', 'name photoUrl')
      .populate('studentId', 'name photoUrl')
      .populate('courseId', 'title baseRate')
      .lean();
    res.json({ bookings });
  } catch (error) { next(error); }
};

export const cancelBookingController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const booking = await cancelBooking(new Types.ObjectId(req.user.id), req.params.id as string);
    res.json({ booking });
  } catch (error) { next(error); }
};

export const completeBookingController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const booking = await completeBooking(new Types.ObjectId(req.user.id), req.params.id as string);
    res.json({ booking });
  } catch (error) { next(error); }
};
