import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../src/middleware/error';
import authRoutes from '../src/routes/auth.routes';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: 'http://localhost:3000' }));
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorMiddleware);
  return app;
};
