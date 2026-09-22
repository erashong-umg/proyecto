import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Appeal } from '@models/Appeal';
import { User } from '@models/User';
import { Unauthorized, BadRequest } from '@utils/errors';

export const createAppeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    if (req.user.status !== 'suspended') throw BadRequest('Solo usuarios suspendidos pueden apelar.');

    // Verificar que no tenga ya una apelación pendiente
    const existing = await Appeal.findOne({ userId: req.user.id, status: 'pending' }).lean();
    if (existing) throw BadRequest('Usted ya tiene una apelación pendiente.');

    const appeal = await Appeal.create({
      userId: new Types.ObjectId(req.user.id),
      message: req.body.message,
      status: 'pending',
    });
    res.status(201).json({ appeal });
  } catch (error) { next(error); }
};

export const getMyAppeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const appeals = await Appeal.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ appeals });
  } catch (error) { next(error); }
};