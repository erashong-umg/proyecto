import { MapPin, CalendarCheck, MessageCircle } from 'lucide-react';
import styles from './AuthBrandPanel.module.scss';

const POINTS = [
  { icon: MapPin, text: 'Tutores cerca de usted, con costo de traslado calculado al instante.' },
  { icon: CalendarCheck, text: 'Reservas sin cruces de horario, para usted y su tutor.' },
  { icon: MessageCircle, text: 'Coordine cada detalle por chat antes de la sesión.' },
];

export const AuthBrandPanel = () => (
  <div className={styles.panel}>
    <div className={styles.content}>
      <h2 className={styles.headline}>Su próxima clase está más cerca de lo que cree.</h2>
      <ul className={styles.points}>
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text}>
            <Icon aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
    <svg className={styles.route} width="220" height="80" viewBox="0 0 220 80" fill="none" aria-hidden="true">
      <circle cx="16" cy="60" r="7" fill="currentColor" />
      <circle cx="204" cy="18" r="7" fill="currentColor" />
      <path d="M22 57 C 80 20, 140 55, 198 20" stroke="currentColor" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
    </svg>
  </div>
);
