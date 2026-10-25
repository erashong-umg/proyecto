import { useState, type FormEvent } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Textarea';
import inputStyles from '../ui/Input.module.scss';
import type { ReportReason } from '../../types/api';
import styles from './BookingDialogs.module.scss';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inasistencia', label: 'No se presentó / inasistencia' },
  { value: 'conducta', label: 'Conducta inapropiada' },
  { value: 'cobros', label: 'Problema con cobros' },
  { value: 'otro', label: 'Otro' },
];

export interface ReportTarget {
  userId: string;
  name: string;
}

interface ReportDialogProps {
  target: ReportTarget | null;
  onClose: () => void;
}

// Cualquiera de los dos participantes puede reportar al otro tras una tutoría.
// El administrador lo revisa en el módulo de moderación.
export const ReportDialog = ({ target, onClose }: ReportDialogProps) => {
  const [reason, setReason] = useState<ReportReason>('inasistencia');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    setReason('inasistencia');
    setEvidence('');
    setError(null);
    setSent(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    if (!evidence.trim()) { setError('Describa lo ocurrido para que el equipo pueda revisarlo.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/reports', { targetUserId: target.userId, reason, evidence: evidence.trim() });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el reporte.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={target !== null} onClose={close} title={target ? `Reportar a ${target.name}` : 'Reportar'}>
      {sent ? (
        <div className={styles.form}>
          <p className={styles.intro}>
            Recibimos su reporte. El equipo de administración lo revisará y tomará una decisión.
          </p>
          <div className={styles.actions}>
            <Button onClick={close}>Entendido</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="report-reason" className={styles.label}>Motivo</label>
            <select
              id="report-reason"
              className={inputStyles.input}
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
            >
              {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <Textarea
            label="¿Qué pasó?"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={4}
            placeholder="Describa lo ocurrido con el mayor detalle posible"
            required
          />

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" variant="danger" isLoading={isSaving}>Enviar reporte</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
