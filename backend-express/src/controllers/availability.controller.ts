import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Availability } from '../models/Availability';
import { Unauthorized, BadRequest } from '../utils/errors';

const validateSlots = (slots: { dayOfWeek: number; startMinute: number; endMinute: number }[]): void => {
  for (const s of slots) {
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6) throw BadRequest('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado).');
    if (s.startMinute < 0 || s.startMinute > 1440) throw BadRequest('startMinute debe estar entre 0 y 1440.');
    if (s.endMinute <= s.startMinute) throw BadRequest('endMinute debe ser mayor que startMinute.');
    if (s.endMinute > 1440) throw BadRequest('endMinute no puede exceder 1440 (24:00).');
  }
};

export const setMyAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'tutor') throw Unauthorized('Solo los tutores pueden configurar disponibilidad.');

    const slots = req.body.slots;
    if (!Array.isArray(slots)) throw BadRequest('Debe enviar un array de slots.');
    validateSlots(slots);

    const availability = await Availability.findOneAndUpdate(
      { tutorId: new Types.ObjectId(req.user.id) },
      { slots },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ availability });
  } catch (error) { next(error); }
};

export const getMyAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const availability = await Availability.findOne({ tutorId: req.user.id }).lean();
    res.json({ availability: availability ?? { slots: [] } });
  } catch (error) { next(error); }
};

export const getTutorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const availability = await Availability.findOne({ tutorId: req.params.tutorId }).lean();
    res.json({ availability: availability ?? { slots: [] } });
  } catch (error) { next(error); }
};
