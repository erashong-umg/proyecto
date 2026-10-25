import { Link } from 'react-router-dom';
import styles from './AuthBrandLink.module.scss';

// Logo que lleva al inicio. Las pantallas de acceso no muestran el Header del
// sitio (repetiría "Iniciar sesión" / "Crear cuenta"), así que este enlace es
// la salida a la página principal en todos los tamaños de pantalla.
export const AuthBrandLink = () => (
  <Link to="/" className={styles.brand} aria-label="EducaSpot — ir al inicio">
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" className={styles.mark}>
      <circle cx="6" cy="19" r="3.5" fill="currentColor" />
      <circle cx="20" cy="7" r="3.5" fill="currentColor" />
      <path d="M8.6 16.6 17.4 9.4" stroke="currentColor" strokeWidth="2" strokeDasharray="1 4" strokeLinecap="round" />
    </svg>
    <span>EducaSpot</span>
  </Link>
);
