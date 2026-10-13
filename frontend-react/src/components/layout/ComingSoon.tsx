import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './ComingSoon.module.scss';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ComingSoon = ({ icon: Icon, title, description }: ComingSoonProps) => (
  <div className={styles.page}>
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <Icon aria-hidden="true" />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/" className={styles.link}>Volver al inicio</Link>
    </div>
  </div>
);
