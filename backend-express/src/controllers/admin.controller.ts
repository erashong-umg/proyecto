import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Category } from '@models/Category';
import { Report } from '@models/Report';
import { Appeal } from '@models/Appeal';
import { User } from '@models/User';
import { Booking } from '@models/Booking';
import { Review } from '@models/Review';
import { Unauthorized, NotFound, BadRequest } from '@utils/errors';

const requireAdmin = (req: Request): void => {
  if (!req.user || req.user.role !== 'admin') {
    throw Unauthorized('Se requiere rol de administrador.');
  }
};

// --- CRUD Categorías ---

export const adminCreateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const cat = await Category.create(req.body);
    res.status(201).json({ category: cat });
  } catch (error) { next(error); }
};

export const adminUpdateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) throw NotFound('Categoría no encontrada.');
    res.json({ category: cat });
  } catch (error) { next(error); }
};

export const adminDeleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) throw NotFound('Categoría no encontrada.');
    res.json({ message: 'Categoría eliminada.' });
  } catch (error) { next(error); }
};

// --- Bandeja de denuncias ---

export const adminListReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporterId', 'name email')
      .populate('targetUserId', 'name email status')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reports });
  } catch (error) { next(error); }
};

export const adminResolveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const { status, resolutionNote } = req.body;
    if (!['reviewing', 'resolved', 'dismissed'].includes(status)) {
      throw BadRequest('Status inválido.');
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolutionNote },
      { new: true }
    );
    if (!report) throw NotFound('Denuncia no encontrada.');
    res.json({ report });
  } catch (error) { next(error); }
};

// --- Bandeja de apelaciones ---

export const adminListAppeals = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Asumimos que el middleware ya validó admin
    if (!_req.user || _req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const appeals = await Appeal.find({})
      .populate('userId', 'name email status suspensionReason')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ appeals });
  } catch (error) { next(error); }
};

export const adminResolveAppeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const { decision, adminResponse } = req.body;        // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(decision)) throw BadRequest('Decisión inválida.');

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) throw NotFound('Apelación no encontrada.');

    appeal.status = decision === 'accept' ? 'accepted' : 'rejected';
    appeal.adminResponse = adminResponse;
    appeal.resolvedAt = new Date();

    if (decision === 'accept') {
      // Reactivar cuenta del usuario
      await User.findByIdAndUpdate(appeal.userId, {
        status: 'active',
        $unset: { suspensionReason: 1, suspensionDate: 1 },
      });
    }
    await appeal.save();

    res.json({ appeal });
  } catch (error) { next(error); }
};

// --- Gestión de cuentas ---

export const adminSuspendUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const { reason } = req.body;
    if (!reason) throw BadRequest('Debe proporcionar un motivo.');

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended', suspensionReason: reason, suspensionDate: new Date() },
      { new: true }
    ).select('email name status suspensionReason');

    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) { next(error); }
};

export const adminReactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('email name status').lean();
    if (!user) throw NotFound('Usuario no encontrado.');
    res.json({ user });
  } catch (error) { next(error); }
};

export const adminListUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const { role, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('email name role status createdAt')
      .limit(100)
      .lean();
    res.json({ users });
  } catch (error) { next(error); }
};
