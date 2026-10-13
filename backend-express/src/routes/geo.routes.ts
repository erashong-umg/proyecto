import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import { calculateDistance } from '@controllers/geo.controller';

const router = Router();
router.post('/distance', authMiddleware, statusMiddleware, calculateDistance);

export default router;
