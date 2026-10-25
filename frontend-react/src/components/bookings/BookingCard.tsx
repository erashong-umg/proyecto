import { useState } from 'react';
import { Video, Home, MapPinned, Star, Flag } from 'lucide-react';
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
  /** Solo el estudiante califica, y solo una vez por tutoría completada. */
  onReview?: () => void;
  /** Cualquiera de los dos puede reportar al otro después de la tutoría. */
  onReport?: () => void;
}

export const BookingCard = ({
  booking: b, counterpartLabel, onCancel, isCancelling, onReview, onReport,
}: BookingCardProps) => {
  const Icon = MODALITY_ICONS[b.modality];
  // Las tutorías se completan solas al terminar su horario (no hay botón manual) y
  // no se pueden cancelar una vez comenzadas.
  const [now] = useState(() => Date.now());
  const isUpcoming = new Date(b.startsAt).getTime() > now;
  const canCancel = (b.status === 'pending' || b.status === 'confirmed') && isUpcoming;
  const isCompleted = b.status === 'completed';
  const canReview = isCompleted && !!onReview && !b.reviewed;
  const canReport = isCompleted && !!onReport;

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

      {(onCancel && canCancel) || canReview || canReport || (isCompleted && b.reviewed) ? (
        <div className={styles.actions}>
          {isCompleted && b.reviewed && <span className={styles.reviewed}><Star aria-hidden="true" /> Ya la calificó</span>}
          {canReview && (
            <Button variant="secondary" size="sm" onClick={onReview}>
              <Star aria-hidden="true" /> Calificar
            </Button>
          )}
          {canReport && (
            <Button variant="ghost" size="sm" onClick={onReport}>
              <Flag aria-hidden="true" /> Reportar
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
