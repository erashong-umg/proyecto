import type { Server as SocketIOServer } from 'socket.io';
import { Types } from 'mongoose';
import { Message } from '../models/Message';
import { logger } from '../utils/logger';
import type { AuthedSocket } from '.';

const makeThreadId = (a: string, b: string): string => {
  return [a, b].sort().join('_');
};

export const setupChatHandlers = (io: SocketIOServer, socket: AuthedSocket): void => {
  // Unirse a un thread específico
  socket.on('chat:join', (payload: { otherUserId: string }, ack?: (resp: unknown) => void) => {
    if (!socket.data.userId) {
      ack?.({ ok: false, error: 'No autenticado' });
      return;
    }
    if (!payload?.otherUserId) {
      ack?.({ ok: false, error: 'otherUserId requerido' });
      return;
    }
    const threadId = makeThreadId(socket.data.userId, payload.otherUserId);
    socket.join(`thread:${threadId}`);
    logger.info(`[Chat] ${socket.data.userId} se unió a thread ${threadId}`);
    ack?.({ ok: true, threadId });
  });

  // Salir de un thread
  socket.on('chat:leave', (payload: { otherUserId: string }) => {
    if (!socket.data.userId || !payload?.otherUserId) return;
    const threadId = makeThreadId(socket.data.userId, payload.otherUserId);
    socket.leave(`thread:${threadId}`);
  });

  // Enviar un mensaje
  socket.on('chat:message', async (payload: { otherUserId: string; content: string }, ack?: (resp: unknown) => void) => {
    try {
      if (!socket.data.userId) {
        ack?.({ ok: false, error: 'No autenticado' });
        return;
      }
      const { otherUserId, content } = payload;
      if (!otherUserId || !content?.trim()) {
        ack?.({ ok: false, error: 'otherUserId y content son requeridos' });
        return;
      }

      const threadId = makeThreadId(socket.data.userId, otherUserId);
      const message = await Message.create({
        threadId,
        senderId: new Types.ObjectId(socket.data.userId),
        content: content.trim(),
        readBy: [new Types.ObjectId(socket.data.userId)],
      });

      // Emitir al thread (incluye al sender para confirmar)
      io.to(`thread:${threadId}`).emit('chat:message', {
        _id: message._id.toString(),
        threadId,
        senderId: socket.data.userId,
        content: message.content,
        createdAt: message.createdAt,
      });

      ack?.({ ok: true, messageId: message._id.toString() });
    } catch (error) {
      logger.error('[Chat] Error enviando mensaje:', error);
      ack?.({ ok: false, error: 'Error al enviar mensaje' });
    }
  });

  // Marcar como leído (D7 del plan: acknowledge de Socket.io)
  socket.on('chat:read', async (payload: { messageIds: string[] }, ack?: (resp: unknown) => void) => {
    try {
      if (!socket.data.userId || !payload?.messageIds) {
        ack?.({ ok: false, error: 'Datos inválidos' });
        return;
      }
      await Message.updateMany(
        { _id: { $in: payload.messageIds } },
        { $addToSet: { readBy: new Types.ObjectId(socket.data.userId) } }
      );
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, error: 'Error al marcar como leído' });
    }
  });
};
