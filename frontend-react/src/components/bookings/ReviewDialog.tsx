import { useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import type { Booking } from '../../types/api';
import styles from './BookingDialogs.module.scss';

interface ReviewDialogProps {
  booking: Booking | null;
  onClose: () => void;
  onDone: () => void;
}

// El estudiante califica una tutoría ya completada: 1 a 5 estrellas y un comentario.
export const ReviewDialog = ({ booking, onClose, onDone }: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    setRating(0);
    setComment('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    if (rating === 0) { setError('Elija de 1 a 5 estrellas.'); return; }
    if (!comment.trim()) { setError('Cuéntenos brevemente cómo fue la tutoría.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/reviews', { bookingId: booking._id, rating, comment: comment.trim() });
      close();
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar su calificación.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={booking !== null} onClose={close} title="Calificar la tutoría">
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.intro}>
          {booking ? `${booking.courseId.title} con ${booking.tutorId.name}` : ''}
        </p>

        <div role="radiogroup" aria-label="Calificación" className={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              className={`${styles.star} ${n <= rating ? styles.starOn : ''}`}
              onClick={() => setRating(n)}
            >
              <Star aria-hidden="true" />
            </button>
          ))}
        </div>

        <Textarea
          label="Comentario"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="¿Cómo fue la clase?"
          required
        />

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
          <Button type="submit" isLoading={isSaving}>Enviar calificación</Button>
        </div>
      </form>
    </Modal>
  );
};
