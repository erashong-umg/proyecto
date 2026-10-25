import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../src/middleware/error';
import authRoutes from '../src/routes/auth.routes';
import metaRoutes from '../src/routes/meta.routes';
import userRoutes from '../src/routes/user.routes';
import courseRoutes from '../src/routes/course.routes';
import tutorRoutes from '../src/routes/tutor.routes';
import adminRoutes from '../src/routes/admin.routes';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: 'http://localhost:3000' }));
  app.use(express.json());
  app.use('/api', metaRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/tutors', tutorRoutes);
  app.use('/api/admin', adminRoutes);
  app.use(errorMiddleware);
  return app;
};
