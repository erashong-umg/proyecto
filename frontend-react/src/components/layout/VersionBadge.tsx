import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { formatDayTime } from '../../services/formatters';
import { FRONTEND_BUILD, isComparable, type BackendVersion } from '../../services/version';
import styles from './VersionBadge.module.scss';

type BranchTone = 'main' | 'release' | 'develop' | 'other';

const toneOf = (branch: string): BranchTone =>
  branch === 'main' || branch === 'release' || branch === 'develop' ? branch : 'other';

// Badge flotante con la versión desplegada. Con un solo servidor que puede
// correr cualquier rama, deja ver de un vistazo qué hay publicado; al abrirlo
// compara frontend y backend para detectar un despliegue a medias.
export const VersionBadge = () => {
  const [open, setOpen] = useState(false);
  const [backend, setBackend] = useState<BackendVersion | null>(null);
  const [backendFailed, setBackendFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BackendVersion>('/version')
      .then((res) => { if (!cancelled) setBackend(res.data); })
      .catch(() => { if (!cancelled) setBackendFailed(true); });
    return () => { cancelled = true; };
  }, []);

  // Se cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const mismatch = backend !== null
    && isComparable(FRONTEND_BUILD.commit)
    && isComparable(backend.commit)
    && FRONTEND_BUILD.commit !== backend.commit;

  const tone = toneOf(FRONTEND_BUILD.branch);

  return (
    <div className={styles.root} ref={rootRef}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Versión de la aplicación">
          <dl>
            <div className={styles.group}>
              <dt>Frontend</dt>
              <dd>
                <strong>{FRONTEND_BUILD.version}</strong>
                <span>{FRONTEND_BUILD.branch} · {FRONTEND_BUILD.commit}</span>
                {FRONTEND_BUILD.builtAt && <span>Compilado {formatDayTime(FRONTEND_BUILD.builtAt)}</span>}
              </dd>
            </div>
            <div className={styles.group}>
              <dt>Backend</dt>
              <dd>
                {backend ? (
                  <>
                    <strong>{backend.version}</strong>
                    <span>{backend.branch} · {backend.commit}</span>
                    {backend.builtAt && <span>Compilado {formatDayTime(backend.builtAt)}</span>}
                  </>
                ) : (
                  <span>{backendFailed ? 'No disponible' : 'Consultando…'}</span>
                )}
              </dd>
            </div>
          </dl>
          {mismatch && (
            <p className={styles.warning} role="status">
              Frontend y backend están en commits distintos: el despliegue puede estar incompleto.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className={`${styles.badge} ${styles[tone]}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Versión ${FRONTEND_BUILD.version}, rama ${FRONTEND_BUILD.branch}. Ver detalles`}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span>{FRONTEND_BUILD.version}</span>
        {tone !== 'main' && <span className={styles.branch}>{FRONTEND_BUILD.branch}</span>}
        {mismatch && <span className={styles.alert} aria-hidden="true">!</span>}
      </button>
    </div>
  );
};
