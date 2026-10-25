import type { Category } from '../../types/api';
import styles from '../../pages/onboarding/Onboarding.module.scss';

interface StepCategoriesProps {
  categories: Category[];
  selectedIds: string[];
  isTutor: boolean;
  onToggle: (categoryId: string) => void;
}

export const StepCategories = ({ categories, selectedIds, isTutor, onToggle }: StepCategoriesProps) => (
  <div className={styles.step}>
    <h3>{isTutor ? '¿Qué enseña?' : 'Sus intereses'}</h3>
    <p className={styles.hint}>Seleccione las categorías en las que {isTutor ? 'ofrece clases' : 'desea aprender'}:</p>
    <div className={styles.categoryGrid}>
      {categories.map((c) => (
        <button
          key={c._id}
          type="button"
          aria-pressed={selectedIds.includes(c._id)}
          className={`${styles.categoryChip} ${selectedIds.includes(c._id) ? styles.selected : ''}`}
          onClick={() => onToggle(c._id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  </div>
);
