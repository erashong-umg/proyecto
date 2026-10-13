import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
// No usamos statusMiddleware aquí — los suspendidos DEBEN poder apelar
import { createAppeal, getMyAppeals } from '@controllers/appeal.controller';

const router = Router();
router.use(authMiddleware);

router.post('/', createAppeal);
router.get('/me', getMyAppeals);

export default router;
