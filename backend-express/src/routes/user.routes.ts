import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';

// Placeholder. En Fase 2 día 4 se implementan:
//   PUT /api/users/me
//   PUT /api/users/me/onboarding
const router = Router();

router.use(authMiddleware, statusMiddleware);

router.get('/me/profile', (req, res) => {
  res.json({ message: 'Endpoint de perfil - implementar en Fase 2 día 4', userId: req.user?.id });
});

export default router;
