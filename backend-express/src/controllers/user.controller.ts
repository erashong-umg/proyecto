import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Unauthorized, NotFound, BadRequest } from '../utils/errors';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires').lean();
    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) { next(error); }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const allowed = ['name', 'photoUrl', 'phone', 'gender', 'address', 'categoryIds'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) { next(error); }
};

export const completeOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');

    const update: Record<string, unknown> = {
      onboardingCompleted: true,
    };

    // Campos comunes
    const commonFields = ['phone', 'gender', 'address', 'categoryIds', 'photoUrl', 'name'] as const;
    for (const f of commonFields) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }

    // Si es tutor, requiere campos de tutorData
    if (req.user.role === 'tutor') {
      const tutorFields = ['bio', 'cvUrl', 'portfolioUrl', 'baseRate', 'ratePerKm', 'categories'] as const;
      const tutorData: Record<string, unknown> = {};
      for (const f of tutorFields) {
        if (req.body[f] !== undefined) tutorData[f] = req.body[f];
      }
      if (Object.keys(tutorData).length > 0) {
        if (!tutorData.bio || !tutorData.cvUrl || tutorData.baseRate === undefined) {
          throw BadRequest('Como tutor debe completar: biografía, URL de CV y tarifa base.');
        }
        update.tutorData = tutorData;
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) { next(error); }
};
