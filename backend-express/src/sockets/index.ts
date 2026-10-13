import type { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { setupChatHandlers } from './chat.handler';
import { logger } from '../utils/logger';

// Extender el tipo Socket para tener user
export interface AuthedSocket extends Socket {
  data: {
    userId?: string;
    role?: string;
    name?: string;
  };
}

export const setupSockets = (io: SocketIOServer): void => {
  // Middleware de auth: el cliente debe enviar el JWT en auth.token del handshake
  // (mismo token que se usa como Bearer en las peticiones REST — ver docs/CLAUDE.md).
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token: string | undefined = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autenticado. Por favor, inicie sesión.'));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('role name status').lean();
      if (!user) return next(new Error('Usuario no encontrado.'));
      if (user.status === 'suspended') return next(new Error('Cuenta suspendida.'));

      socket.data.userId = decoded.id;
      socket.data.role = user.role;
      socket.data.name = user.name;
      next();
    } catch (err) {
      next(new Error('Token inválido o expirado.'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    logger.info(`[Socket] Conectado: ${socket.id} (userId=${socket.data.userId})`);

    // Cada socket se une a su room personal
    socket.join(`user:${socket.data.userId}`);

    setupChatHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`[Socket] Desconectado: ${socket.id} (userId=${socket.data.userId})`);
    });
  });
};
