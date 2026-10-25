import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAdminTutors, type PendingTutor } from '../../hooks/useAdminTutors';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { formatShortDate, getInitials } from '../../services/formatters';
import { ID_DOCUMENT_LABELS } from '../../services/idDocument';
import styles from './Tutors.module.scss';

export const AdminTutorsPage = () => {
  const { tutors, isLoading, isSaving, error, approve, reject } = useAdminTutors();
  const [confirmReject, setConfirmReject] = useState<PendingTutor | null>(null);
  const [reason, setReason] = useState('');

  const openReject = (tutor: PendingTutor) => {
    setConfirmReject(tutor);
    setReason('');
  };

  const handleReject = async () => {
    if (!confirmReject || !reason.trim()) return;
    const ok = await reject(confirmReject._id, reason.trim());
    if (ok) setConfirmReject(null);
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Tutores pendientes de aprobación</h1>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : tutors.length === 0 ? (
        <div className={styles.empty}>No hay solicitudes de tutor pendientes por revisar.</div>
      ) : (
        <ul className={styles.list}>
          {tutors.map((tutor) => (
            <li key={tutor._id} className={styles.item}>
              {tutor.photoUrl ? (
                <img src={tutor.photoUrl} alt="" className={styles.photo} />
              ) : (
                <span className={styles.avatar} aria-hidden="true">{getInitials(tutor.name)}</span>
              )}

              <div className={styles.info}>
                <h3>{tutor.name}</h3>
                <p className={styles.email}>{tutor.email}</p>
                <p className={styles.date}>
                  {tutor.idDocument
                    ? `${ID_DOCUMENT_LABELS[tutor.idDocument.type]}: ${tutor.idDocument.number}`
                    : 'Sin documento de identificación'}
                </p>
                <p className={styles.date}>Registrado el {formatShortDate(tutor.createdAt)}</p>
              </div>

              <div className={styles.actions}>
                <Button size="sm" onClick={() => approve(tutor._id)} isLoading={isSaving}>
                  <Check aria-hidden="true" /> Aprobar
                </Button>
                <Button size="sm" variant="danger" onClick={() => openReject(tutor)} disabled={isSaving}>
                  <X aria-hidden="true" /> Rechazar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        title="Rechazar solicitud de tutor"
      >
        <p className={styles.confirmText}>
          Indique el motivo por el cual se rechaza la solicitud de "{confirmReject?.name}". Esta acción
          suspenderá la cuenta del usuario.
        </p>
        <Textarea
          label="Motivo del rechazo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setConfirmReject(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleReject} disabled={!reason.trim()} isLoading={isSaving}>
            Rechazar
          </Button>
        </div>
      </Modal>
    </div>
  );
};
