import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDB } from './config/db';
import { errorMiddleware } from './middleware/error';
import { setupSockets } from './sockets';
import metaRoutes from './routes/meta.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import courseRoutes from './routes/course.routes';
import availabilityRoutes from './routes/availability.routes';
import bookingRoutes from './routes/booking.routes';
import tutorRoutes from './routes/tutor.routes';
import geoRoutes from './routes/geo.routes';
import reviewRoutes from './routes/review.routes';
import reportRoutes from './routes/report.routes';
import appealRoutes from './routes/appeal.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import themeRoutes from './routes/theme.routes';
import favicon from 'serve-favicon';
import path from 'path';


const app = express();
const httpServer = createServer(app);

// Detrás de nginx (reverse proxy en producción) — sin esto, req.ip y los logs
// de morgan muestran la IP de nginx (127.0.0.1) en vez de la del cliente real.
app.set('trust proxy', 1);

// Usar el middleware antes de tus rutas o registradores (loggers)
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));   // JWT va en el header Authorization, no en cookies
app.use(express.json());
app.use(morgan(env.LOG_LEVEL));

// Rutas de la API
// La API nunca se guarda en caché del navegador ni de proxys intermedios: son datos vivos
// (reservas, mensajes, sesión) y una copia vieja se vería como un error.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/api', metaRoutes);   // /api/health y /api/version
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/theme', themeRoutes);

// Socket.io (chat en tiempo real, autenticado por JWT — ver src/sockets/index.ts)
const io = new SocketIOServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN },
});
setupSockets(io);

// Manejo de errores (SIEMPRE al final)
app.use(errorMiddleware);

// Arranque
const start = async (): Promise<void> => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    console.log(`[Server] educaspot API escuchando en http://localhost:${env.PORT}`);
    console.log(`[Server] Socket.io listo en ws://localhost:${env.PORT}`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
    console.log(`[Server] Versión ${env.APP_VERSION} (${env.APP_BRANCH}@${env.APP_COMMIT})`);
  });
};

start();
