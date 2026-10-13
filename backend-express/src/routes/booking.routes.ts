import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import {
  createBookingController, getMyBookings,
  cancelBookingController, completeBookingController,
} from '@controllers/booking.controller';

const router = Router();
router.use(authMiddleware, statusMiddleware);

router.post('/', createBookingController);          // Solo student (validado en controller)
router.get('/me', getMyBookings);
router.patch('/:id/cancel', cancelBookingController);
router.patch('/:id/complete', completeBookingController);

export default router;
