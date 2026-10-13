import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import { createReport, getMyReports } from '@controllers/report.controller';

const router = Router();
router.use(authMiddleware, statusMiddleware);

router.post('/', createReport);
router.get('/me', getMyReports);

export default router;
