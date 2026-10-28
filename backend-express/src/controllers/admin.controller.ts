import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Category } from '@models/Category';
import { Report } from '@models/Report';
import { Appeal } from '@models/Appeal';
import { User } from '@models/User';
import { Booking } from '@models/Booking';
import { Review } from '@models/Review';
import { AuditLog } from '@models/AuditLog';
import { Unauthorized, NotFound, BadRequest } from '@utils/errors';
import { logAdminAction } from '@services/audit.service';

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
    await logAdminAction(req.user!, 'category.create', 'Category', cat._id, cat.name);
    res.status(201).json({ category: cat });
  } catch (error) { next(error); }
};

export const adminUpdateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) throw NotFound('Categoría no encontrada.');
    await logAdminAction(req.user!, 'category.update', 'Category', cat._id, cat.name);
    res.json({ category: cat });
  } catch (error) { next(error); }
};

export const adminDeleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) throw NotFound('Categoría no encontrada.');
    await logAdminAction(req.user!, 'category.delete', 'Category', cat._id, cat.name);
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
    await logAdminAction(req.user!, 'report.resolve', 'Report', report._id, `status=${status}`);
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
    await logAdminAction(req.user!, 'appeal.resolve', 'Appeal', appeal._id, `decision=${decision}`);

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
    await logAdminAction(req.user!, 'user.suspend', 'User', user._id, reason);
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
    await logAdminAction(req.user!, 'user.reactivate', 'User', user._id);
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

// --- Reportería / Analytics ---

export const adminAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!_req.user || _req.user.role !== 'admin') throw Unauthorized('Solo admin.');

    const [topTutors, bottomTutors, categoryDemand, monthlyStats] = await Promise.all([
      // Top 5 tutores por rating (mejor calificados)
      User.find({ role: 'tutor', 'tutorData.reviewCount': { $gte: 1 } })
        .sort({ 'tutorData.avgRating': -1 })
        .limit(5)
        .select('name photoUrl tutorData')
        .lean(),

      // Bottom 5 tutores por rating (peor calificados)
      User.find({ role: 'tutor', 'tutorData.reviewCount': { $gte: 1 } })
        .sort({ 'tutorData.avgRating': 1 })
        .limit(5)
        .select('name photoUrl tutorData')
        .lean(),

      // Demanda por categoría (total horas reservadas)
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $group: { _id: '$course.categoryId', totalHours: { $sum: '$durationMin' }, count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { _id: 0, categoryName: '$category.name', totalHours: { $divide: ['$totalHours', 60] }, count: '$count' } },
        { $sort: { totalHours: -1 } },
        { $limit: 10 },
      ]),

      // Stats mensuales: impartidas vs canceladas (último mes)
      (() => {
        const since = new Date();
        since.setMonth(since.getMonth() - 1);
        return Booking.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
      })(),
    ]);

    res.json({
      topTutors,
      bottomTutors,
      categoryDemand,
      monthlyStats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) { next(error); }
};

// --- Aprobar tutor ---

export const adminApproveTutor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'tutor' },
      { 'tutorData.approved': true },
      { new: true }
    ).select('name email tutorData');
    if (!user) throw NotFound('Tutor no encontrado.');
    await logAdminAction(req.user!, 'tutor.approve', 'User', user._id, user.name);
    res.json({ user });
  } catch (error) { next(error); }
};

// --- Auditoría ---

export const adminListAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    requireAdmin(req);
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ logs });
  } catch (error) { next(error); }
};

export const adminListPendingTutors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!_req.user || _req.user.role !== 'admin') throw Unauthorized('Solo admin.');
    const tutors = await User.find({ role: 'tutor', 'tutorData.approved': false })
      .select('name email photoUrl tutorData createdAt +idDocument')  // +idDocument: el admin verifica la identidad al aprobar
      .lean();
    res.json({ tutors });
  } catch (error) { next(error); }
};
