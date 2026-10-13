import { useState } from 'react';
import { ShieldAlert, MessagesSquare, Check, X } from 'lucide-react';
import { useAdminModeration } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { formatShortDate } from '../../services/formatters';
import type { Appeal, Report, ReportReason, ReportStatus } from '../../types/api';
import inputStyles from '../../components/ui/Input.module.scss';
import styles from './Moderation.module.scss';

const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inasistencia: 'Inasistencia',
  conducta: 'Conducta',
  cobros: 'Cobros',
  otro: 'Otro',
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Abierta',
  reviewing: 'En revisión',
  resolved: 'Resuelta',
  dismissed: 'Descartada',
};

const APPEAL_STATUS_LABELS: Record<Appeal['status'], string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

type ModerationTab = 'reports' | 'appeals';
type ReportResolution = Exclude<ReportStatus, 'open'>;

const REPORT_RESOLUTION_COPY: Record<ReportResolution, string> = {
  reviewing: 'poner en revisión',
  resolved: 'resolver',
  dismissed: 'descartar',
};

export const AdminModerationPage = () => {
  const [tab, setTab] = useState<ModerationTab>('reports');

  const {
    reports, reportsLoading, reportsError, reportStatusFilter, setReportStatusFilter,
    resolveReport, resolvingReportId,
    appeals, appealsLoading, appealsError,
    resolveAppeal, resolvingAppealId,
  } = useAdminModeration();

  const [reportModal, setReportModal] = useState<{ report: Report; status: ReportResolution } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const [appealModal, setAppealModal] = useState<{ appeal: Appeal; decision: 'accept' | 'reject' } | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const openReportModal = (report: Report, status: ReportResolution) => {
    setResolutionNote(report.resolutionNote ?? '');
    setReportModal({ report, status });
  };

  const confirmReport = async () => {
    if (!reportModal) return;
    const ok = await resolveReport(reportModal.report._id, reportModal.status, resolutionNote.trim() || undefined);
    if (ok) setReportModal(null);
  };

  const openAppealModal = (appeal: Appeal, decision: 'accept' | 'reject') => {
    setAdminResponse('');
    setAppealModal({ appeal, decision });
  };

  const confirmAppeal = async () => {
    if (!appealModal) return;
    const ok = await resolveAppeal(appealModal.appeal._id, appealModal.decision, adminResponse.trim() || undefined);
    if (ok) setAppealModal(null);
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Moderación</h1>
        <p className={styles.subtitle}>
          Revise las denuncias entre usuarios y resuelva las apelaciones de cuentas suspendidas.
        </p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Secciones de moderación">
        <button
          type="button"
          role="tab"
          id="mod-tab-reports"
          aria-selected={tab === 'reports'}
          aria-controls="mod-panel-reports"
          tabIndex={tab === 'reports' ? 0 : -1}
          className={`${styles.tab} ${tab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setTab('reports')}
        >
          <ShieldAlert aria-hidden="true" /> Denuncias
        </button>
        <button
          type="button"
          role="tab"
          id="mod-tab-appeals"
          aria-selected={tab === 'appeals'}
          aria-controls="mod-panel-appeals"
          tabIndex={tab === 'appeals' ? 0 : -1}
          className={`${styles.tab} ${tab === 'appeals' ? styles.tabActive : ''}`}
          onClick={() => setTab('appeals')}
        >
          <MessagesSquare aria-hidden="true" /> Apelaciones
        </button>
      </div>

      {tab === 'reports' && (
        <section id="mod-panel-reports" role="tabpanel" aria-labelledby="mod-tab-reports" tabIndex={0}>
          <div className={styles.filters}>
            <div className={inputStyles.field}>
              <label className={inputStyles.label} htmlFor="report-status-filter">Filtrar por estado</label>
              <select
                id="report-status-filter"
                className={inputStyles.input}
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value as ReportStatus | '')}
              >
                <option value="">Todas</option>
                <option value="open">Abierta</option>
                <option value="reviewing">En revisión</option>
                <option value="resolved">Resuelta</option>
                <option value="dismissed">Descartada</option>
              </select>
            </div>
          </div>

          {reportsError && <p className={styles.errorMsg}>{reportsError}</p>}

          {reportsLoading ? (
            <p className={styles.status}>Cargando…</p>
          ) : reports.length === 0 ? (
            <div className={styles.empty}>
              <ShieldAlert aria-hidden="true" />
              <p>No hay denuncias registradas con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Denunciante</th>
                    <th>Denunciado</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id}>
                      <td>{r.reporterId?.name ?? '—'}</td>
                      <td>{r.targetUserId?.name ?? '—'}</td>
                      <td>{REPORT_REASON_LABELS[r.reason]}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`reportStatus-${r.status}`]}`}>
                          {REPORT_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td>{formatShortDate(r.createdAt)}</td>
                      <td className={styles.actionsCell}>
                        {(['reviewing', 'resolved', 'dismissed'] as ReportResolution[])
                          .filter((status) => status !== r.status)
                          .map((status) => (
                            <button
                              key={status}
                              type="button"
                              className={status === 'dismissed' ? styles.linkBtnDanger : styles.linkBtn}
                              disabled={resolvingReportId === r._id}
                              onClick={() => openReportModal(r, status)}
                              aria-label={`${REPORT_RESOLUTION_COPY[status]} la denuncia de ${r.reporterId?.name ?? 'usuario'} contra ${r.targetUserId?.name ?? 'usuario'}`}
                            >
                              {REPORT_STATUS_LABELS[status]}
                            </button>
                          ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'appeals' && (
        <section id="mod-panel-appeals" role="tabpanel" aria-labelledby="mod-tab-appeals" tabIndex={0}>
          {appealsError && <p className={styles.errorMsg}>{appealsError}</p>}

          {appealsLoading ? (
            <p className={styles.status}>Cargando…</p>
          ) : appeals.length === 0 ? (
            <div className={styles.empty}>
              <MessagesSquare aria-hidden="true" />
              <p>No hay apelaciones registradas.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <strong>{a.userId?.name ?? '—'}</strong>
                        <div className={styles.subtle}>{a.userId?.email}</div>
                      </td>
                      <td className={styles.messageCell}>{a.message}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`appealStatus-${a.status}`]}`}>
                          {APPEAL_STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        {a.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              disabled={resolvingAppealId === a._id}
                              onClick={() => openAppealModal(a, 'accept')}
                              aria-label={`Aceptar apelación y reactivar la cuenta de ${a.userId?.name ?? 'usuario'}`}
                            >
                              <Check aria-hidden="true" /> Aceptar
                            </button>
                            <button
                              type="button"
                              className={styles.linkBtnDanger}
                              disabled={resolvingAppealId === a._id}
                              onClick={() => openAppealModal(a, 'reject')}
                              aria-label={`Rechazar apelación de ${a.userId?.name ?? 'usuario'}`}
                            >
                              <X aria-hidden="true" /> Rechazar
                            </button>
                          </>
                        ) : (
                          <span className={styles.subtle}>Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Modal
        isOpen={!!reportModal}
        onClose={() => setReportModal(null)}
        title={reportModal ? `Marcar como "${REPORT_STATUS_LABELS[reportModal.status]}"` : undefined}
      >
        {reportModal && (
          <>
            <p className={styles.confirmText}>
              Denuncia de <strong>{reportModal.report.reporterId?.name ?? 'usuario'}</strong> contra{' '}
              <strong>{reportModal.report.targetUserId?.name ?? 'usuario'}</strong> por{' '}
              {REPORT_REASON_LABELS[reportModal.report.reason].toLowerCase()}.
            </p>
            <Textarea
              label="Nota de resolución (opcional)"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
            />
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setReportModal(null)}>Cancelar</Button>
              <Button
                variant={reportModal.status === 'dismissed' ? 'danger' : 'primary'}
                onClick={confirmReport}
                isLoading={resolvingReportId === reportModal.report._id}
              >
                Confirmar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={!!appealModal}
        onClose={() => setAppealModal(null)}
        title={appealModal?.decision === 'accept' ? 'Aceptar apelación' : 'Rechazar apelación'}
      >
        {appealModal && (
          <>
            <p className={styles.confirmText}>
              {appealModal.decision === 'accept'
                ? <>Se reactivará la cuenta de <strong>{appealModal.appeal.userId?.name ?? 'este usuario'}</strong> y podrá volver a iniciar sesión de inmediato.</>
                : <>Se mantendrá la suspensión de <strong>{appealModal.appeal.userId?.name ?? 'este usuario'}</strong>.</>}
            </p>
            <Textarea
              label="Respuesta al usuario (opcional)"
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={3}
            />
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setAppealModal(null)}>Cancelar</Button>
              <Button
                variant={appealModal.decision === 'reject' ? 'danger' : 'primary'}
                onClick={confirmAppeal}
                isLoading={resolvingAppealId === appealModal.appeal._id}
              >
                Confirmar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
