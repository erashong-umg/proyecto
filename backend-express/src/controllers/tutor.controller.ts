import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Review } from '../models/Review';
import { NotFound } from '../utils/errors';
import { searchTutors, type SearchTutorsParams } from '../services/search.service';

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
    const params: SearchTutorsParams = {
      ...(req.query as any),
    };
    const tutors = await searchTutors(params);
    res.json({ tutors });
  } catch (error) { next(error); }
};
