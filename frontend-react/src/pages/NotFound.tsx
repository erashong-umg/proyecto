import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from '../components/layout/ComingSoon.module.scss';

export const NotFoundPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Compass aria-hidden="true" />
        </div>
        <h1>Página no encontrada</h1>
        <p>La página que busca no existe o se movió de lugar.</p>
        <Link to="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
};
