import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Message } from '@models/Message';
import { BadRequest, Forbidden, Unauthorized } from '@utils/errors';

// El threadId se arma como `${idA}_${idB}` con los dos ObjectId de los participantes
// ordenados alfabéticamente (ver makeThreadId en src/sockets/chat.handler.ts).
// Esta función valida ese formato y devuelve los dos ids por separado.
const parseThreadId = (threadId: string): [string, string] | null => {
  const partes = threadId.split('_');
  if (partes.length !== 2) return null;
  const [a, b] = partes;
  if (!Types.ObjectId.isValid(a) || !Types.ObjectId.isValid(b)) return null;
  return [a, b];
};

// GET /api/chat/threads
// Lista las conversaciones del usuario autenticado: el otro participante,
// el último mensaje y la cantidad de mensajes no leídos.
export const getChatThreads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');

    const userIdStr = req.user.id;
    const userObjId = new Types.ObjectId(userIdStr);

    const threads = await Message.aggregate([
      // Solo threads donde el usuario autenticado participa (threadId = idA_idB)
      {
        $match: {
          $or: [
            { threadId: { $regex: `^${userIdStr}_` } },
            { threadId: { $regex: `_${userIdStr}$` } },
          ],
        },
      },
      // Separamos el threadId en los dos ids para identificar al otro participante
      { $addFields: { participantes: { $split: ['$threadId', '_'] } } },
      {
        $addFields: {
          otroParticipanteId: {
            $arrayElemAt: [
              { $filter: { input: '$participantes', as: 'p', cond: { $ne: ['$$p', userIdStr] } } },
              0,
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$threadId',
          otroParticipanteId: { $first: '$otroParticipanteId' },
          lastMessage: { $first: '$$ROOT' },
          // Message no tiene campo read/readAt, solo `readBy` (array de ids que ya
          // leyeron el mensaje). Un mensaje cuenta como "no leído" si no lo envió
          // el usuario autenticado y su id no está en readBy.
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$senderId', userObjId] },
                    { $not: [{ $in: [userObjId, { $ifNull: ['$readBy', []] }] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $addFields: { otroParticipanteObjId: { $toObjectId: '$otroParticipanteId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'otroParticipanteObjId',
          foreignField: '_id',
          as: 'otroUsuario',
        },
      },
      { $unwind: '$otroUsuario' },
      {
        $project: {
          _id: 0,
          threadId: '$_id',
          otherUser: {
            _id: '$otroUsuario._id',
            name: '$otroUsuario.name',
            photoUrl: '$otroUsuario.photoUrl',
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            senderId: '$lastMessage.senderId',
            readBy: '$lastMessage.readBy',
            deliveredTo: '$lastMessage.deliveredTo',
          },
          unreadCount: 1,
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    res.json({ threads });
  } catch (error) { next(error); }
};

// GET /api/chat/threads/:threadId/messages?limit=50&before=<isoDate>
// Historial paginado de un thread (orden descendente por fecha).
export const getThreadMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');

    const threadId = String(req.params.threadId);
    const idsParticipantes = parseThreadId(threadId);
    if (!idsParticipantes) {
      throw BadRequest('El threadId debe tener el formato "idUsuarioA_idUsuarioB" con dos ObjectId válidos.');
    }

    const [idA, idB] = idsParticipantes;
    if (req.user.id !== idA && req.user.id !== idB) {
      throw Forbidden('No tiene acceso a esta conversación.');
    }

    const limitRaw = parseInt(String(req.query.limit ?? '50'), 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

    const filter: Record<string, unknown> = { threadId };
    if (req.query.before) {
      const beforeDate = new Date(String(req.query.before));
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ messages });
  } catch (error) { next(error); }
};
