import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import { calculateDistance, calculateRoute } from '@controllers/geo.controller';

const router = Router();
router.post('/route', authMiddleware, statusMiddleware, calculateRoute);
router.post('/distance', authMiddleware, statusMiddleware, calculateDistance);

export default router;
