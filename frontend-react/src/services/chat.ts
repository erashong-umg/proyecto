import type { MessageDeliveryStatus } from '../types/api';

interface StatusSource {
  readBy?: string[];
  deliveredTo?: string[];
  localStatus?: 'pending' | 'failed';
}

// Estado de un mensaje propio, como los checks de WhatsApp: reloj (pendiente),
// un check (enviado), dos checks (entregado) y dos checks azules (leído).
export const getDeliveryStatus = (message: StatusSource, otherUserId: string): MessageDeliveryStatus => {
  if (message.localStatus) return message.localStatus;
  if (message.readBy?.includes(otherUserId)) return 'read';
  if (message.deliveredTo?.includes(otherUserId)) return 'delivered';
  return 'sent';
};

// crypto.randomUUID solo existe en contextos seguros (https / localhost).
export const createClientId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
