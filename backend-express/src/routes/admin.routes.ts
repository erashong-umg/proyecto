import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { roleMiddleware } from '@middleware/role';
import {
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminListReports, adminResolveReport,
  adminListAppeals, adminResolveAppeal,
  adminSuspendUser, adminReactivateUser, adminListUsers,
  adminAnalytics, adminApproveTutor, adminListPendingTutors,
} from '@controllers/admin.controller';

const router = Router();
router.use(authMiddleware, roleMiddleware('admin'));

router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminDeleteCategory);

router.get('/reports', adminListReports);
router.patch('/reports/:id', adminResolveReport);

router.get('/appeals', adminListAppeals);
router.patch('/appeals/:id', adminResolveAppeal);

router.get('/users', adminListUsers);
router.patch('/users/:id/suspend', adminSuspendUser);
router.patch('/users/:id/reactivate', adminReactivateUser);

router.get('/tutors/pending', adminListPendingTutors);
router.patch('/tutors/:id/approve', adminApproveTutor);

router.get('/analytics', adminAnalytics);

export default router;
