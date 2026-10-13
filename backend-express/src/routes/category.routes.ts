import { Router } from 'express';
import { listCategories } from '@controllers/category.controller';
// createCategory y deleteCategory se usan en admin (Fase 4 día 16). Por ahora solo público.

const router = Router();
router.get('/', listCategories);

export default router;
