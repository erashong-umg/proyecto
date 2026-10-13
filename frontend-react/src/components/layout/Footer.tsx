import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <p className={styles.copy}>© {new Date().getFullYear()} EducaSpot — Marketplace educativo.</p>
        <nav className={styles.links}>
          <Link to="/politicas">Políticas de convivencia</Link>
          <a href="mailto:soporte@educaspot.gt">Soporte</a>
        </nav>
      </div>
    </footer>
  );
};
