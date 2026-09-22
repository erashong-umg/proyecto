import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../src/middleware/error';
import authRoutes from '../src/routes/auth.routes';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorMiddleware);
  return app;
};
