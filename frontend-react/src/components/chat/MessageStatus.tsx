import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';
import type { MessageDeliveryStatus } from '../../types/api';
import styles from './MessageStatus.module.scss';

const LABELS: Record<MessageDeliveryStatus, string> = {
  pending: 'Enviando',
  failed: 'No enviado',
  sent: 'Enviado',
  delivered: 'Entregado',
  read: 'Leído',
};

const ICONS = {
  pending: Clock,
  failed: AlertCircle,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
} as const;

// Indicador de estado de un mensaje propio, estilo WhatsApp: reloj, un check,
// dos checks y dos checks azules.
export const MessageStatus = ({ status }: { status: MessageDeliveryStatus }) => {
  const Icon = ICONS[status];
  return (
    <span className={`${styles.status} ${styles[status]}`} role="img" aria-label={LABELS[status]}>
      <Icon aria-hidden="true" />
    </span>
  );
};
