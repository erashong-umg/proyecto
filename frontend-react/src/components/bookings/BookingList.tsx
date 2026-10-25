import { useState } from 'react';
import { BookingCard } from './BookingCard';
import { ReviewDialog } from './ReviewDialog';
import { ReportDialog, type ReportTarget } from './ReportDialog';
import type { Booking } from '../../types/api';

interface BookingListProps {
  bookings: Booking[];
  /** Desde qué lado se ve la lista: define quién es la contraparte y quién puede calificar. */
  viewer: 'student' | 'tutor';
  onCancel: (bookingId: string) => void;
  cancellingId: string | null;
  /** Se llama tras calificar, para recargar y ocultar el botón. */
  onReviewed: () => void;
  className?: string;
}

// Lista de reservas con todo el ciclo de una tutoría: cancelar mientras es futura,
// y al completarse sola, calificar (estudiante) o reportar (cualquiera).
export const BookingList = ({ bookings, viewer, onCancel, cancellingId, onReviewed, className }: BookingListProps) => {
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);

  return (
    <>
      <div className={className}>
        {bookings.map((b) => {
          const counterpart = viewer === 'student' ? b.tutorId : b.studentId;
          return (
            <BookingCard
              key={b._id}
              booking={b}
              counterpartLabel={viewer === 'student' ? `con ${counterpart.name}` : `Estudiante: ${counterpart.name}`}
              onCancel={() => onCancel(b._id)}
              isCancelling={cancellingId === b._id}
              onReview={viewer === 'student' ? () => setReviewing(b) : undefined}
              onReport={() => setReporting({ userId: counterpart._id, name: counterpart.name })}
            />
          );
        })}
      </div>

      <ReviewDialog booking={reviewing} onClose={() => setReviewing(null)} onDone={onReviewed} />
      <ReportDialog target={reporting} onClose={() => setReporting(null)} />
    </>
  );
};
