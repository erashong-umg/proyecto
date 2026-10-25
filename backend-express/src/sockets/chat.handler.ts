import type { Server as SocketIOServer } from 'socket.io';
import { Types } from 'mongoose';
import { Message, type IMessage } from '../models/Message';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { isOnline, presenceRoom, userRoom } from './presence';
import type { AuthedSocket } from '.';

type Ack = (resp: unknown) => void;

const MAX_CONTENT = 5000;
const MAX_READ_BATCH = 200;
const MAX_DELIVER_BATCH = 500;

const makeThreadId = (a: string, b: string): string => {
  return [a, b].sort().join('_');
};

const isId = (value: unknown): value is string =>
  typeof value === 'string' && Types.ObjectId.isValid(value);

// Filtro de mensajes que pertenecen a algún thread del usuario (threadId = idA_idB).
const threadsDe = (userId: string) => ({
  $or: [
    { threadId: { $regex: `^${userId}_` } },
    { threadId: { $regex: `_${userId}$` } },
  ],
});

const serializeMessage = (m: IMessage) => ({
  _id: m._id.toString(),
  threadId: m.threadId,
  senderId: m.senderId.toString(),
  content: m.content,
  createdAt: m.createdAt,
  clientId: m.clientId,
  readBy: m.readBy.map(String),
  deliveredTo: m.deliveredTo.map(String),
});

// Al conectarse, todo lo que le escribieron mientras estaba offline pasa a
// "entregado" (doble check gris para el remitente).
export const markPendingAsDelivered = async (io: SocketIOServer, userId: string): Promise<void> => {
  const me = new Types.ObjectId(userId);
  const pendientes = await Message.find({
    ...threadsDe(userId),
    senderId: { $ne: me },
    deliveredTo: { $ne: me },
  })
    .select('_id threadId senderId')
    .limit(MAX_DELIVER_BATCH)
    .lean();
  if (pendientes.length === 0) return;

  await Message.updateMany(
    { _id: { $in: pendientes.map((m) => m._id) } },
    { $addToSet: { deliveredTo: me } }
  );

  const porRemitente = new Map<string, { threadId: string; messageIds: string[] }>();
  for (const m of pendientes) {
    const remitente = m.senderId.toString();
    const grupo = porRemitente.get(remitente) ?? { threadId: m.threadId, messageIds: [] };
    grupo.messageIds.push(m._id.toString());
    porRemitente.set(remitente, grupo);
  }
  for (const [remitente, grupo] of porRemitente) {
    io.to(userRoom(remitente)).emit('chat:delivered', { ...grupo, userId });
  }
};

export const setupChatHandlers = (io: SocketIOServer, socket: AuthedSocket): void => {
  // Abrir una conversación: devuelve datos del contacto y su presencia, y
  // suscribe a sus cambios de estado (en línea / últ. vez).
  socket.on('chat:join', async (payload: { otherUserId: string }, ack?: Ack) => {
    try {
      const me = socket.data.userId;
      if (!me) return ack?.({ ok: false, error: 'No autenticado' });
      if (!isId(payload?.otherUserId) || payload.otherUserId === me) {
        return ack?.({ ok: false, error: 'otherUserId inválido' });
      }

      const other = await User.findById(payload.otherUserId).select('name photoUrl lastSeenAt').lean();
      if (!other) return ack?.({ ok: false, error: 'Usuario no encontrado' });

      const threadId = makeThreadId(me, payload.otherUserId);
      socket.join(presenceRoom(payload.otherUserId));
      logger.info(`[Chat] ${me} abrió thread ${threadId}`);
      ack?.({
        ok: true,
        threadId,
        contact: { _id: other._id.toString(), name: other.name, photoUrl: other.photoUrl },
        presence: { online: isOnline(payload.otherUserId), lastSeenAt: other.lastSeenAt ?? null },
      });
    } catch (error) {
      logger.error('[Chat] Error en chat:join:', error);
      ack?.({ ok: false, error: 'Error al abrir la conversación' });
    }
  });

  // Cerrar una conversación: deja de seguir la presencia del contacto.
  socket.on('chat:leave', (payload: { otherUserId: string }) => {
    if (!socket.data.userId || !isId(payload?.otherUserId)) return;
    socket.leave(presenceRoom(payload.otherUserId));
  });

  // Enviar un mensaje. Se entrega a las rooms personales de ambos usuarios
  // (todas sus pestañas, estén o no mirando esa conversación). `clientId` lo
  // genera el cliente: si el mismo mensaje se reenvía, no se duplica.
  socket.on('chat:message', async (payload: { otherUserId: string; content: string; clientId?: string }, ack?: Ack) => {
    try {
      const me = socket.data.userId;
      if (!me) return ack?.({ ok: false, error: 'No autenticado' });

      const { otherUserId, clientId } = payload ?? {};
      const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
      if (!isId(otherUserId) || !content) {
        return ack?.({ ok: false, error: 'otherUserId y content son requeridos' });
      }
      if (otherUserId === me) return ack?.({ ok: false, error: 'No puede escribirse a sí mismo' });
      if (content.length > MAX_CONTENT) {
        return ack?.({ ok: false, error: `El mensaje no puede superar ${MAX_CONTENT} caracteres` });
      }
      if (!(await User.exists({ _id: otherUserId }))) {
        return ack?.({ ok: false, error: 'Usuario no encontrado' });
      }

      if (typeof clientId === 'string' && clientId) {
        const existente = await Message.findOne({ senderId: me, clientId }).select('_id').lean();
        if (existente) return ack?.({ ok: true, messageId: existente._id.toString() });
      }

      const threadId = makeThreadId(me, otherUserId);
      const message = await Message.create({
        threadId,
        senderId: new Types.ObjectId(me),
        content,
        readBy: [new Types.ObjectId(me)],
        deliveredTo: isOnline(otherUserId) ? [new Types.ObjectId(otherUserId)] : [],
        clientId: typeof clientId === 'string' ? clientId.slice(0, 64) : undefined,
      });

      io.to(userRoom(me)).to(userRoom(otherUserId)).emit('chat:message', serializeMessage(message));
      ack?.({ ok: true, messageId: message._id.toString() });
    } catch (error) {
      logger.error('[Chat] Error enviando mensaje:', error);
      ack?.({ ok: false, error: 'Error al enviar mensaje' });
    }
  });

  // Marcar como leído. Solo aplica a mensajes de los threads del usuario que
  // escribió la otra persona; el remitente se entera (tick azul) por 'chat:read'.
  socket.on('chat:read', async (payload: { messageIds: string[] }, ack?: Ack) => {
    try {
      const me = socket.data.userId;
      if (!me || !Array.isArray(payload?.messageIds)) {
        return ack?.({ ok: false, error: 'Datos inválidos' });
      }
      const meId = new Types.ObjectId(me);
      const ids = payload.messageIds.filter(isId).slice(0, MAX_READ_BATCH);

      const mensajes = await Message.find({
        _id: { $in: ids },
        senderId: { $ne: meId },
        ...threadsDe(me),
      })
        .select('_id threadId senderId')
        .lean();

      if (mensajes.length > 0) {
        await Message.updateMany(
          { _id: { $in: mensajes.map((m) => m._id) } },
          { $addToSet: { readBy: meId, deliveredTo: meId } }
        );

        const porRemitente = new Map<string, { threadId: string; messageIds: string[] }>();
        for (const m of mensajes) {
          const remitente = m.senderId.toString();
          const grupo = porRemitente.get(remitente) ?? { threadId: m.threadId, messageIds: [] };
          grupo.messageIds.push(m._id.toString());
          porRemitente.set(remitente, grupo);
        }
        for (const [remitente, grupo] of porRemitente) {
          io.to(userRoom(remitente)).to(userRoom(me)).emit('chat:read', { ...grupo, readerId: me });
        }
      }
      ack?.({ ok: true });
    } catch (error) {
      logger.error('[Chat] Error marcando como leído:', error);
      ack?.({ ok: false, error: 'Error al marcar como leído' });
    }
  });

  // "escribiendo…": efímero, no se guarda.
  socket.on('chat:typing', (payload: { otherUserId: string; isTyping: boolean }) => {
    const me = socket.data.userId;
    if (!me || !isId(payload?.otherUserId) || payload.otherUserId === me) return;
    io.to(userRoom(payload.otherUserId)).emit('chat:typing', {
      threadId: makeThreadId(me, payload.otherUserId),
      userId: me,
      isTyping: Boolean(payload.isTyping),
    });
  });
};
