import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { FRONTEND_BUILD, isComparable, type BackendVersion } from '../../services/version';
import styles from './UpdateBanner.module.scss';

// Cada cuánto como máximo se pregunta al servidor qué versión corre.
const MIN_CHECK_GAP_MS = 2 * 60 * 1000;
const PERIODIC_CHECK_MS = 10 * 60 * 1000;

// Aviso de "hay una versión nueva". Quien deja la pestaña abierta durante un despliegue sigue
// con el código viejo en memoria: se compara el commit con el que se compiló esta página contra
// el que informa el backend (GET /api/version) al volver a la pestaña y cada 10 minutos.
export const UpdateBanner = () => {
  const [outdated, setOutdated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Sin commit de despliegue (desarrollo local) no hay nada que comparar.
    if (!isComparable(FRONTEND_BUILD.commit)) return;

    let lastCheck = 0;
    const check = () => {
      if (Date.now() - lastCheck < MIN_CHECK_GAP_MS) return;
      lastCheck = Date.now();
      api
        .get<BackendVersion>('/version')
        .then((res) => {
          if (isComparable(res.data.commit) && res.data.commit !== FRONTEND_BUILD.commit) setOutdated(true);
        })
        .catch(() => { /* sin red o servidor caído: se vuelve a intentar más tarde */ });
    };

    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    check();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => { lastCheck = 0; check(); }, PERIODIC_CHECK_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  if (!outdated || dismissed) return null;

  return (
    <div className={styles.banner} role="status">
      <span>Hay una versión nueva de EducaSpot.</span>
      <button type="button" className={styles.update} onClick={() => window.location.reload()}>
        <RefreshCw aria-hidden="true" /> Actualizar
      </button>
      <button type="button" className={styles.later} onClick={() => setDismissed(true)}>Más tarde</button>
    </div>
  );
};
