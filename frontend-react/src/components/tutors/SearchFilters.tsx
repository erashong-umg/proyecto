import { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import inputStyles from '../ui/Input.module.scss';
import type { Modality } from '../../types/api';
import styles from './SearchFilters.module.scss';

// Valores como texto: son lo que escribe la persona en los campos. `toCriteria`
// los convierte a los números que espera la API.
export interface SearchFilterValues {
  radiusKm: string;
  minRating: string;
  minReviews: string;
  minPrice: string;
  maxPrice: string;
  modality: '' | Modality;
}

export const EMPTY_FILTERS: SearchFilterValues = {
  radiusKm: '', minRating: '', minReviews: '', minPrice: '', maxPrice: '', modality: '',
};

export const activeFilterCount = (v: SearchFilterValues): number =>
  Object.values(v).filter((x) => x !== '').length;

/** Mensaje de error si los filtros no son coherentes; null si están bien. */
export const validateFilters = (v: SearchFilterValues): string | null => {
  if (v.minPrice !== '' && v.maxPrice !== '' && Number(v.minPrice) > Number(v.maxPrice)) {
    return 'El precio mínimo no puede ser mayor que el máximo.';
  }
  return null;
};

const RADIUS_OPTIONS = [1, 3, 5, 10, 25];
const RATING_OPTIONS = [3, 4, 4.5];
const REVIEW_OPTIONS = [1, 3, 5, 10];

interface SearchFiltersProps {
  values: SearchFilterValues;
  onChange: (values: SearchFilterValues) => void;
  onClear: () => void;
  error: string | null;
}

// Filtros que pide el enunciado: cercanía, calificación, cantidad de reseñas,
// rango de precio y modalidad (la categoría es el buscador de arriba). Van
// plegados para no ocupar el panel y muestran cuántos hay activos.
export const SearchFilters = ({ values, onChange, onClear, error }: SearchFiltersProps) => {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(values);
  const set = <K extends keyof SearchFilterValues>(key: K, value: SearchFilterValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className={styles.filters} data-tour="buscar-filtros">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="search-filters-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal aria-hidden="true" />
        Filtros
        {count > 0 && <span className={styles.count} aria-label={`${count} filtros activos`}>{count}</span>}
        <ChevronDown aria-hidden="true" className={open ? styles.chevronOpen : undefined} />
      </button>

      {open && (
        <div id="search-filters-panel" className={styles.panel}>
          <div className={styles.field}>
            <label htmlFor="f-radius">Distancia</label>
            <select id="f-radius" className={inputStyles.input} value={values.radiusKm} onChange={(e) => set('radiusKm', e.target.value)}>
              <option value="">Sin límite</option>
              {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>A menos de {r} km</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="f-modality">Modalidad</label>
            <select id="f-modality" className={inputStyles.input} value={values.modality} onChange={(e) => set('modality', e.target.value as SearchFilterValues['modality'])}>
              <option value="">Cualquiera</option>
              <option value="virtual">Virtual</option>
              <option value="presencial-tutor">En casa del tutor</option>
              <option value="presencial-estudiante">A mi domicilio</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="f-rating">Calificación</label>
            <select id="f-rating" className={inputStyles.input} value={values.minRating} onChange={(e) => set('minRating', e.target.value)}>
              <option value="">Cualquiera</option>
              {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}★ o más</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="f-reviews">Reseñas</label>
            <select id="f-reviews" className={inputStyles.input} value={values.minReviews} onChange={(e) => set('minReviews', e.target.value)}>
              <option value="">Cualquiera</option>
              {REVIEW_OPTIONS.map((r) => <option key={r} value={r}>{r} o más</option>)}
            </select>
          </div>

          <div className={`${styles.field} ${styles.wide}`}>
            <span id="f-price-label" className={styles.label}>Precio por hora (Q)</span>
            <div className={styles.range} role="group" aria-labelledby="f-price-label">
              <input
                type="number" min={0} inputMode="numeric" placeholder="Mín."
                aria-label="Precio mínimo" className={inputStyles.input}
                value={values.minPrice} onChange={(e) => set('minPrice', e.target.value)}
              />
              <span aria-hidden="true">–</span>
              <input
                type="number" min={0} inputMode="numeric" placeholder="Máx."
                aria-label="Precio máximo" className={inputStyles.input}
                value={values.maxPrice} onChange={(e) => set('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}

          <div className={`${styles.actions} ${styles.wide}`}>
            <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={count === 0}>Limpiar filtros</Button>
          </div>
        </div>
      )}
    </div>
  );
};
