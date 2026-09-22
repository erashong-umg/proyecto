import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { Unauthorized, NotFound, BadRequest } from '../utils/errors';

export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) throw NotFound('Reserva no encontrada.');
    if (!booking.studentId.equals(req.user.id)) throw Unauthorized('No le pertenece esta reserva.');
    if (booking.status !== 'completed') throw BadRequest('Solo puede calificar reservas completadas.');

    // Verificar que no existe ya una review para este booking
    const existing = await Review.findOne({ bookingId }).lean();
    if (existing) throw BadRequest('Ya existe una reseña para esta reserva.');

    const review = await Review.create({
      tutorId: booking.tutorId,
      studentId: booking.studentId,
      bookingId: booking._id,
      rating,
      comment,
    });

    // Recalcular avgRating y reviewCount del tutor
    const stats = await Review.aggregate([
      { $match: { tutorId: booking.tutorId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(booking.tutorId, {
        'tutorData.avgRating': Math.round(stats[0].avg * 10) / 10,
        'tutorData.reviewCount': stats[0].count,
      });
    }

    res.status(201).json({ review });
  } catch (error) { next(error); }
};

export const getTutorReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name photoUrl')
      .lean();
    res.json({ reviews });
  } catch (error) { next(error); }
};