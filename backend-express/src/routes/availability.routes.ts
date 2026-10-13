import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { roleMiddleware } from '@middleware/role';
import { statusMiddleware } from '@middleware/status';
import {
  setMyAvailability, getMyAvailability, getTutorAvailability,
} from '@controllers/availability.controller';

const router = Router();

router.get('/me', authMiddleware, statusMiddleware, roleMiddleware('tutor'), getMyAvailability);
router.put('/me', authMiddleware, statusMiddleware, roleMiddleware('tutor'), setMyAvailability);
router.get('/:tutorId', getTutorAvailability);

export default router;
