import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { TutorSummary } from '../../types/api';
import { formatQ, getInitials } from '../../services/formatters';
import styles from './TutorResultItem.module.scss';

interface TutorResultItemProps {
  tutor: TutorSummary;
  categoryMap: Map<string, string>;
  isSelected: boolean;
  onSelect: () => void;
  /** Distancia por calles, cuando ya se dibujó la ruta a este tutor: reemplaza a la de línea recta. */
  roadDistanceKm?: number;
}

export const TutorResultItem = ({ tutor, categoryMap, isSelected, onSelect, roadDistanceKm }: TutorResultItemProps) => {
  const { tutorData } = tutor;
  // Con la ruta calculada se usa la distancia real, la misma con la que se cobra el traslado al reservar.
  const distanceKm = roadDistanceKm ?? tutor.distanceKm;
  const transportCost = distanceKm !== undefined
    ? Math.round(distanceKm * tutorData.ratePerKm * 100) / 100
    : undefined;
  const categoryName = tutorData.categories.length > 0 ? categoryMap.get(tutorData.categories[0]) : undefined;

  return (
    <div className={`${styles.item} ${isSelected ? styles.selected : ''}`} onMouseEnter={onSelect} onFocus={onSelect}>
      <Link to={`/tutores/${tutor._id}`} className={styles.link}>
        {tutor.photoUrl ? (
          <img src={tutor.photoUrl} alt="" className={styles.photo} />
        ) : (
          <span className={styles.avatar}>{getInitials(tutor.name)}</span>
        )}

        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3>{tutor.name}</h3>
            {distanceKm !== undefined && <span className={styles.distance}>{distanceKm} km</span>}
          </div>
          <div className={styles.metaRow}>
            <span className={styles.rating}>
              <Star aria-hidden="true" />
              {tutorData.avgRating > 0 ? tutorData.avgRating.toFixed(1) : 'Nuevo/a'}
            </span>
            {categoryName && <span className={styles.category}>{categoryName}</span>}
          </div>
        </div>

        <div className={styles.price}>
          <strong>{formatQ(tutorData.baseRate)}</strong>
          <small>/ hora</small>
          {transportCost !== undefined && transportCost > 0 && (
            <span className={styles.transport}>+{formatQ(transportCost)} traslado</span>
          )}
        </div>
      </Link>
    </div>
  );
};
