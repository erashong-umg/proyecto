import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Report } from '../models/Report';
import { Unauthorized } from '../utils/errors';

export const createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const { targetUserId, reason, evidence } = req.body;

    if (new Types.ObjectId(targetUserId).equals(req.user.id)) {
      throw Unauthorized('No puede reportarse a sí mismo.');
    }

    const report = await Report.create({
      reporterId: new Types.ObjectId(req.user.id),
      targetUserId: new Types.ObjectId(targetUserId),
      reason,
      evidence,
      status: 'open',
    });
    res.status(201).json({ report });
  } catch (error) { next(error); }
};

export const getMyReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const reports = await Report.find({ reporterId: req.user.id })
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (error) { next(error); }
};