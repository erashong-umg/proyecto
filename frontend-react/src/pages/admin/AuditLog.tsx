import { ClipboardList } from 'lucide-react';
import { useAdminAuditLog } from '../../hooks/useAdminAuditLog';
import { formatDayTime } from '../../services/formatters';
import styles from './AuditLog.module.scss';

const ACTION_LABELS: Record<string, string> = {
  'category.create': 'Creó categoría',
  'category.update': 'Editó categoría',
  'category.delete': 'Eliminó categoría',
  'report.resolve': 'Resolvió denuncia',
  'appeal.resolve': 'Resolvió apelación',
  'user.suspend': 'Suspendió cuenta',
  'user.reactivate': 'Reactivó cuenta',
  'tutor.approve': 'Aprobó tutor',
};

export const AdminAuditLogPage = () => {
  const { logs, isLoading, error } = useAdminAuditLog();

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Registro de auditoría</h1>
        <p className={styles.subtitle}>
          Historial de acciones administrativas sensibles (categorías, moderación, suspensiones y aprobación de tutores).
        </p>
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : logs.length === 0 ? (
        <div className={styles.empty}>
          <ClipboardList aria-hidden="true" />
          <p>Todavía no hay acciones administrativas registradas.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Administrador</th>
                <th>Acción</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{formatDayTime(log.createdAt)}</td>
                  <td>{log.adminName}</td>
                  <td>{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td>{log.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
