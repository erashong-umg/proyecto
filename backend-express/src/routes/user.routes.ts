import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import { getMe, updateMe, completeOnboarding } from '@controllers/user.controller';

const router = Router();

router.use(authMiddleware, statusMiddleware);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/onboarding', completeOnboarding);

export default router;
