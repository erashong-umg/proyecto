import { Router } from 'express';
import { authMiddleware } from '@middleware/auth';
import { roleMiddleware } from '@middleware/role';
import { validate } from '@middleware/validate';
import { themeSettingsSchema } from '@utils/validators';
import { getThemeSettings, updateThemeSettings, resetThemeSettings } from '@controllers/theme.controller';

const router = Router();

// Público y sin autenticación: el tema debe aplicarse incluso en /login y
// /register, antes de que exista una sesión.
router.get('/', getThemeSettings);

router.patch('/', authMiddleware, roleMiddleware('admin'), validate(themeSettingsSchema), updateThemeSettings);
router.post('/reset', authMiddleware, roleMiddleware('admin'), resetThemeSettings);

export default router;
