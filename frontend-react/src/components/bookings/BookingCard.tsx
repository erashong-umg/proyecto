import { Video, Home, MapPinned, CircleCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatQ, formatDayTime } from '../../services/formatters';
import type { Booking, BookingStatus, Modality } from '../../types/api';
import styles from './BookingCard.module.scss';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const MODALITY_LABELS: Record<Modality, string> = {
  virtual: 'Virtual',
  'presencial-tutor': 'En casa del tutor',
  'presencial-estudiante': 'A domicilio del estudiante',
};

const MODALITY_ICONS: Record<Modality, typeof Video> = {
  virtual: Video,
  'presencial-tutor': Home,
  'presencial-estudiante': MapPinned,
};

interface BookingCardProps {
  booking: Booking;
  /** Texto bajo el título que identifica a la contraparte, p.ej. "con María García" o "Estudiante: Juan Pérez". */
  counterpartLabel: string;
  onCancel?: () => void;
  isCancelling?: boolean;
  onComplete?: () => void;
  isCompleting?: boolean;
}

export const BookingCard = ({
  booking: b, counterpartLabel, onCancel, isCancelling, onComplete, isCompleting,
}: BookingCardProps) => {
  const Icon = MODALITY_ICONS[b.modality];
  const canCancel = b.status === 'pending' || b.status === 'confirmed';
  const canComplete = b.status === 'confirmed';

  return (
    <div className={styles.card}>
      <div className={styles.main}>
        <div>
          <h3>{b.courseId.title}</h3>
          <p className={styles.counterpart}>{counterpartLabel}</p>
        </div>
        <span className={`${styles.badge} ${styles[`status-${b.status}`]}`}>{STATUS_LABELS[b.status]}</span>
      </div>

      <div className={styles.meta}>
        <span>{formatDayTime(b.startsAt)}</span>
        <span className={styles.modality}><Icon aria-hidden="true" /> {MODALITY_LABELS[b.modality]}</span>
        <span className={styles.price}>{formatQ(b.priceBreakdown.total)}</span>
      </div>

      {(onCancel && canCancel) || (onComplete && canComplete) ? (
        <div className={styles.actions}>
          {onComplete && canComplete && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isCompleting}
              onClick={onComplete}
            >
              <CircleCheck aria-hidden="true" /> Marcar completada
            </Button>
          )}
          {onCancel && canCancel && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={isCancelling}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};
