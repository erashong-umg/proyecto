import { useEffect, useState } from 'react';
import { Search, LocateFixed, MapPinOff, SearchX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCategories } from '../../hooks/useCategories';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNearbySearch } from '../../hooks/useNearbySearch';
import { useTripRoute } from '../../hooks/useTripRoute';
import { matchCategory } from '../../services/categoryMatch';
import { SearchMap } from '../../components/tutors/SearchMap';
import { TutorResultItem } from '../../components/tutors/TutorResultItem';
import { SearchFilters, EMPTY_FILTERS, activeFilterCount, validateFilters, type SearchFilterValues } from '../../components/tutors/SearchFilters';
import { Button } from '../../components/ui/Button';
import type { Category, SearchCriteria } from '../../types/api';
import inputStyles from '../../components/ui/Input.module.scss';
import styles from './TutorSearch.module.scss';

// Convierte lo que se escribió en los filtros (texto) en los criterios numéricos de la API.
const toCriteria = (categoryId: string | undefined, f: SearchFilterValues): SearchCriteria => ({
  categoryId,
  radiusKm: f.radiusKm ? Number(f.radiusKm) : undefined,
  minRating: f.minRating ? Number(f.minRating) : undefined,
  minReviews: f.minReviews ? Number(f.minReviews) : undefined,
  minPrice: f.minPrice ? Number(f.minPrice) : undefined,
  maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
  modality: f.modality || undefined,
});

const buildCategoryMap = (categories: Category[]): Map<string, string> =>
  new Map(categories.map((c) => [c._id, c.name]));

export const TutorSearchPage = () => {
  const { user } = useAuth();
  const { categories } = useCategories();
  const { coords, isLocating, error: geoError, source, hasFallback, retry, useSavedLocation } = useGeolocation(user?.address?.coords);
  const { tutors, isLoading, error: searchError, search } = useNearbySearch();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noMatchNote, setNoMatchNote] = useState(false);
  const [filters, setFilters] = useState<SearchFilterValues>(EMPTY_FILTERS);
  const [filterError, setFilterError] = useState<string | null>(null);

  const categoryMap = buildCategoryMap(categories);

  // Al seleccionar un tutor se traza la ruta hasta él. Como la selección cambia al pasar el
  // mouse por la lista, se espera a que se quede quieta antes de pedirla.
  const selectedTutor = tutors.find((t) => t._id === selectedId);
  const { route, isLoading: routeLoading } = useTripRoute(
    selectedTutor ? coords ?? undefined : undefined,
    selectedTutor?.address?.coords,
    { debounceMs: 350 }
  );

  // Primera búsqueda automática apenas se conoce la ubicación: todos los
  // tutores cercanos, sin filtro de categoría.
  useEffect(() => {
    if (coords) search(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lng]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    const invalid = validateFilters(filters);
    setFilterError(invalid);
    if (invalid) return;
    const match = matchCategory(query, categories);
    setNoMatchNote(query.trim() !== '' && !match);
    setSelectedId(null);
    search(coords, toCriteria(match?._id, filters));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFilterError(null);
    setSelectedId(null);
    if (!coords) return;
    const match = matchCategory(query, categories);
    search(coords, toCriteria(match?._id, EMPTY_FILTERS));
  };

  if (isLocating) {
    return (
      <div className={styles.centerState}>
        <LocateFixed aria-hidden="true" className={styles.spinIcon} />
        <p>Obteniendo su ubicación… acepte el permiso que le pide el navegador.</p>
        {hasFallback && (
          <Button variant="secondary" size="sm" onClick={useSavedLocation}>Usar mi dirección registrada</Button>
        )}
      </div>
    );
  }

  if (!coords) {
    return (
      <div className={styles.centerState}>
        <MapPinOff aria-hidden="true" />
        <p>{geoError ?? 'Necesitamos su ubicación para buscar tutores cerca de usted.'}</p>
        <Button onClick={retry}>Intentar de nuevo</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.mapArea} data-tour="buscar-mapa">
        <SearchMap
          userCoords={coords}
          tutors={tutors}
          selectedTutorId={selectedId}
          onSelectTutor={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          route={route}
          routeLoading={routeLoading}
        />
      </div>

      <div className={styles.panel}>
        <form className={styles.searchForm} onSubmit={handleSearch} data-tour="buscar-barra">
          <div className={styles.searchBar}>
            <Search aria-hidden="true" className={styles.searchIcon} />
            <input
              type="text"
              className={inputStyles.input}
              placeholder="¿Qué quiere aprender? Ej. natación, inglés…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" size="sm" isLoading={isLoading}>Buscar</Button>
          </div>
          <SearchFilters values={filters} onChange={setFilters} onClear={clearFilters} error={filterError} />
        </form>

        <p className={styles.locationCaption}>
          <LocateFixed aria-hidden="true" />
          {source === 'gps' ? 'Usando su ubicación actual' : 'Usando su dirección registrada'}
          {source === 'gps' && hasFallback && (
            <button type="button" className={styles.switchLocation} onClick={useSavedLocation}>
              Usar mi dirección registrada
            </button>
          )}
          {source === 'saved' && (
            <button type="button" className={styles.switchLocation} onClick={retry}>
              Usar mi ubicación actual
            </button>
          )}
        </p>

        {noMatchNote && (
          <p className={styles.note}>No encontramos "{query}" entre las categorías — mostrando todos los tutores cercanos.</p>
        )}
        {searchError && <p className={styles.error}>{searchError}</p>}

        <div className={styles.results} data-tour="buscar-resultados">
          {isLoading ? (
            <p className={styles.status}>Buscando cerca de usted…</p>
          ) : tutors.length === 0 ? (
            <div className={styles.empty}>
              <SearchX aria-hidden="true" />
              <p>
                {activeFilterCount(filters) > 0
                  ? 'Ningún tutor cumple todos esos filtros. Pruebe ampliarlos o limpiarlos.'
                  : 'No hay tutores cerca con ese criterio.'}
              </p>
              {activeFilterCount(filters) > 0 && (
                <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
              )}
            </div>
          ) : (
            <>
              <p className={styles.resultsCount}>{tutors.length} tutor{tutors.length === 1 ? '' : 'es'} cerca de usted</p>
              <div className={styles.list}>
                {tutors.map((tutor) => (
                  <TutorResultItem
                    key={tutor._id}
                    tutor={tutor}
                    categoryMap={categoryMap}
                    isSelected={selectedId === tutor._id}
                    onSelect={() => setSelectedId(tutor._id)}
                    roadDistanceKm={selectedId === tutor._id && route?.source === 'osrm' ? route.distanceKm : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
