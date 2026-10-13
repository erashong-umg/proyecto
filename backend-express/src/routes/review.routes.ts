import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import { createReview, getTutorReviews } from '@controllers/review.controller';

const router = Router();

router.get('/tutor/:tutorId', getTutorReviews);
router.post('/', authMiddleware, statusMiddleware, createReview);

export default router;
