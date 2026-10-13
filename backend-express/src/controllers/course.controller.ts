import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course';
import { Category } from '../models/Category';
import { Unauthorized, NotFound, BadRequest } from '../utils/errors';

export const createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'tutor') throw Unauthorized('Solo los tutores pueden crear cursos.');
    const { categoryId, title, description, modalities, baseRate, ratePerKm } = req.body;

    const cat = await Category.findById(categoryId).lean();
    if (!cat) throw BadRequest('La categoría no existe.');

    const course = await Course.create({
      tutorId: new Types.ObjectId(req.user.id),
      categoryId: new Types.ObjectId(categoryId),
      title,
      description,
      modalities,
      baseRate,
      ratePerKm: ratePerKm ?? 0,
    });
    res.status(201).json({ course });
  } catch (error) { next(error); }
};

export const listCourses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const courses = await Course.find({ active: true })
      .populate('tutorId', 'name photoUrl tutorData')
      .populate('categoryId', 'name slug')
      .lean();
    res.json({ courses });
  } catch (error) { next(error); }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('tutorId', 'name photoUrl tutorData address')
      .populate('categoryId', 'name slug')
      .lean();
    if (!course) throw NotFound('Curso no encontrado.');
    res.json({ course });
  } catch (error) { next(error); }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const course = await Course.findById(req.params.id);
    if (!course) throw NotFound('Curso no encontrado.');
    if (!course.tutorId.equals(req.user.id)) throw Unauthorized('No es el dueño de este curso.');

    const allowed = ['title', 'description', 'modalities', 'baseRate', 'ratePerKm', 'active'] as const;
    for (const k of allowed) {
      if (req.body[k] !== undefined) (course as any)[k] = req.body[k];
    }
    await course.save();
    res.json({ course });
  } catch (error) { next(error); }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const course = await Course.findById(req.params.id);
    if (!course) throw NotFound('Curso no encontrado.');
    if (!course.tutorId.equals(req.user.id)) throw Unauthorized('No es el dueño de este curso.');

    course.active = false;
    await course.save();
    res.json({ message: 'Curso desactivado.' });
  } catch (error) { next(error); }
};

export const getMyCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const courses = await Course.find({ tutorId: req.user.id, active: true })
      .populate('categoryId', 'name slug')
      .lean();
    res.json({ courses });
  } catch (error) { next(error); }
};
