import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`[DB] Conectado a MongoDB: ${env.MONGODB_URI}`);
  } catch (error) {
    console.error('[DB] Error de conexión:', error);
    process.exit(1);
  }
};
