import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { roleMiddleware } from '@middleware/role';
import { statusMiddleware } from '@middleware/status';
import {
  createCourse, listCourses, getCourse, updateCourse, deleteCourse, getMyCourses,
} from '@controllers/course.controller';

const router = Router();

// Públicas
router.get('/', listCourses);
router.get('/:id', getCourse);

// Tutor autenticado
router.post('/', authMiddleware, statusMiddleware, roleMiddleware('tutor'), createCourse);
router.put('/:id', authMiddleware, statusMiddleware, roleMiddleware('tutor'), updateCourse);
router.delete('/:id', authMiddleware, statusMiddleware, roleMiddleware('tutor'), deleteCourse);
router.get('/me/list', authMiddleware, statusMiddleware, roleMiddleware('tutor'), getMyCourses);

export default router;
