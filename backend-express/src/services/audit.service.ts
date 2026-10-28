import { Types } from 'mongoose';
import { AuditLog, type AuditAction } from '../models/AuditLog';
import { logger } from '../utils/logger';

/**
 * Registra una acción administrativa sensible para fines de auditoría
 * (requisito 3.10/5.12 de la especificación). Nunca debe bloquear la acción
 * real: si el registro falla, se deja constancia en el logger y se continúa.
 */
export const logAdminAction = async (
  admin: { id: string; name: string },
  action: AuditAction,
  targetType: string,
  targetId?: string | Types.ObjectId,
  detail?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      adminId: new Types.ObjectId(admin.id),
      adminName: admin.name,
      action,
      targetType,
      targetId: targetId ? new Types.ObjectId(targetId) : undefined,
      detail,
    });
  } catch (err) {
    logger.error('No se pudo registrar la auditoría administrativa', { action, targetType, targetId, err });
  }
};
