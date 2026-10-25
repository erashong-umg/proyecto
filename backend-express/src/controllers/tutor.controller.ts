import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Review } from '../models/Review';
import { NotFound, BadRequest } from '../utils/errors';
import { searchTutors } from '../services/search.service';
import { searchTutorsQuerySchema } from '../utils/validators';

export const getTutorPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tutor = await User.findOne({
      _id: req.params.id,
      role: 'tutor',
      status: 'active',
      'tutorData.approved': true,
    })
      .select('name photoUrl bio tutorData address categoryIds createdAt')
      .lean();
    if (!tutor) throw NotFound('Tutor no encontrado o no aprobado.');

    const courses = await Course.find({ tutorId: tutor._id, active: true })
      .populate('categoryId', 'name slug')
      .lean();

    const reviews = await Review.find({ tutorId: tutor._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('studentId', 'name')
      .lean();

    res.json({ tutor, courses, reviews });
  } catch (error) { next(error); }
};

export const searchTutorsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = searchTutorsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw BadRequest(parsed.error.issues[0]?.message ?? 'Parámetros de búsqueda inválidos.');
    }
    if (parsed.data.minPrice !== undefined && parsed.data.maxPrice !== undefined && parsed.data.minPrice > parsed.data.maxPrice) {
      throw BadRequest('El precio mínimo no puede ser mayor que el máximo.');
    }
    const tutors = await searchTutors(parsed.data);
    res.json({ tutors });
  } catch (error) { next(error); }
};
