import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { NotFound } from '../utils/errors';

export const listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cats = await Category.find({}).lean();
    res.json({ categories: cats });
  } catch (error) { next(error); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ category: cat });
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) throw NotFound('Categoría no encontrada.');
    res.json({ message: 'Categoría eliminada.' });
  } catch (error) { next(error); }
};
