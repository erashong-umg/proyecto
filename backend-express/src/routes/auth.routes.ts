import { Router } from 'express';
import {
  register, login, logout, me, googleStub,
  forgotPassword, resetPassword,
} from '@controllers/auth.controller';
import { validate } from '@middleware/validate';
import { authMiddleware } from '@middleware/auth';
import { statusMiddleware } from '@middleware/status';
import {
  registerSchema, loginSchema, googleStubSchema,
  forgotPasswordSchema, resetPasswordSchema,
} from '@utils/validators';

const router = Router();

router.post('/register',         validate(registerSchema),        register);
router.post('/login',            validate(loginSchema),           login);
router.post('/logout',                                                 logout);
router.post('/google',           validate(googleStubSchema),      googleStub);
router.post('/forgot-password',  validate(forgotPasswordSchema),  forgotPassword);
router.post('/reset-password',   validate(resetPasswordSchema),   resetPassword);

router.get('/me', authMiddleware, statusMiddleware, me);

export default router;
