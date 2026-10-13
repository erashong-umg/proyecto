import { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { useAdminUsers, type AdminUser } from '../../hooks/useAdminUsers';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import type { UserRole, UserStatus } from '../../types/user';
import inputStyles from '../../components/ui/Input.module.scss';
import styles from './Users.module.scss';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Estudiante',
  tutor: 'Tutor',
  admin: 'Administrador',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
};

const PAGE_SIZE = 10;

export const AdminUsersPage = () => {
  const currentUser = useAuthStore((s) => s.user);
  const {
    users, isLoading, isSaving, error,
    roleFilter, setRoleFilter, statusFilter, setStatusFilter,
    suspend, reactivate,
  } = useAdminUsers();

  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [users, page]
  );

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as UserRole | '');
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as UserStatus | '');
    setPage(1);
  };

  const openSuspend = (u: AdminUser) => {
    setSuspendTarget(u);
    setReason('');
    setReasonError(null);
  };

  const closeSuspend = () => {
    setSuspendTarget(null);
    setReason('');
    setReasonError(null);
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError('Debe indicar un motivo para suspender la cuenta.');
      return;
    }
    const ok = await suspend(suspendTarget._id, trimmed);
    if (ok) closeSuspend();
  };

  const confirmReactivate = async () => {
    if (!reactivateTarget) return;
    const ok = await reactivate(reactivateTarget._id);
    if (ok) setReactivateTarget(null);
  };

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Gestión de usuarios</h1>
        <p className={styles.subtitle}>Consulte y administre el estado de las cuentas registradas en la plataforma.</p>
      </header>

      <div className={styles.filters}>
        <div className={inputStyles.field}>
          <label className={inputStyles.label} htmlFor="filter-role">Rol</label>
          <select
            id="filter-role"
            className={inputStyles.input}
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="student">Estudiante</option>
            <option value="tutor">Tutor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className={inputStyles.field}>
          <label className={inputStyles.label} htmlFor="filter-status">Estado</label>
          <select
            id="filter-status"
            className={inputStyles.input}
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          <UsersIcon aria-hidden="true" />
          <p>No se encontraron usuarios con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => {
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{ROLE_LABELS[u.role]}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${u.status === 'active' ? styles.statusActive : styles.statusSuspended}`}
                        >
                          {STATUS_LABELS[u.status]}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        {u.status === 'active' ? (
                          <button
                            type="button"
                            className={styles.linkBtnDanger}
                            onClick={() => openSuspend(u)}
                            disabled={isSelf}
                            aria-label={isSelf ? 'No puede suspender su propia cuenta' : `Suspender a ${u.name}`}
                            title={isSelf ? 'No puede suspender su propia cuenta' : undefined}
                          >
                            <ShieldAlert aria-hidden="true" /> Suspender
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setReactivateTarget(u)}
                            aria-label={`Reactivar a ${u.name}`}
                          >
                            <ShieldCheck aria-hidden="true" /> Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav className={styles.pagination} aria-label="Paginación de usuarios">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              Anterior
            </Button>
            <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-label="Página siguiente"
            >
              Siguiente
            </Button>
          </nav>
        </>
      )}

      <Modal isOpen={!!suspendTarget} onClose={closeSuspend} title="Suspender usuario">
        <p className={styles.confirmText}>
          ¿Suspender la cuenta de <strong>{suspendTarget?.name}</strong>? No podrá iniciar sesión hasta que
          se reactive o se resuelva una apelación.
        </p>
        <Textarea
          label="Motivo de la suspensión"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setReasonError(null); }}
          error={reasonError ?? undefined}
          rows={3}
          required
        />
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={closeSuspend}>Cancelar</Button>
          <Button variant="danger" onClick={confirmSuspend} isLoading={isSaving}>Suspender</Button>
        </div>
      </Modal>

      <Modal isOpen={!!reactivateTarget} onClose={() => setReactivateTarget(null)} title="Reactivar usuario">
        <p className={styles.confirmText}>
          ¿Reactivar la cuenta de <strong>{reactivateTarget?.name}</strong>? Podrá volver a iniciar sesión
          de inmediato.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setReactivateTarget(null)}>Cancelar</Button>
          <Button onClick={confirmReactivate} isLoading={isSaving}>Reactivar</Button>
        </div>
      </Modal>
    </div>
  );
};
