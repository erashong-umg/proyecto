import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`[DB] Conectado a MongoDB: ${env.MONGODB_URI}`);
  } catch (error) {
    logger.error('[DB] Error de conexión:', error);
    process.exit(1);
  }
};
