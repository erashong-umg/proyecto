import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDB } from './config/db';
import { errorMiddleware } from './middleware/error';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app = express();
const httpServer = createServer(app);

// Middlewares globales
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,            // necesario para cookies httpOnly cross-origin
}));
app.use(express.json());
app.use(cookieParser());         // necesario para leer la cookie `educaspot_token`
app.use(morgan(env.LOG_LEVEL));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'educaspot-backend',
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Socket.io (preparado para Fase 2 chat con JWT)
const io = new SocketIOServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

// Manejo de errores (SIEMPRE al final)
app.use(errorMiddleware);

// Arranque
const start = async (): Promise<void> => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`[Server] educaspot API escuchando en http://localhost:${env.PORT}`);
    console.log(`[Server] Socket.io listo en ws://localhost:${env.PORT}`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
  });
};

start();
