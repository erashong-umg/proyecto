import { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MapPicker } from '../map/MapPicker';
import { geocodeAddress } from '../../services/geocode';
import styles from '../../pages/onboarding/Onboarding.module.scss';

interface StepAddressProps {
  street: string;
  coords: { lat: number; lng: number };
  onChangeStreet: (value: string) => void;
  onChangeCoords: (coords: { lat: number; lng: number }) => void;
}

type SearchStatus = 'idle' | 'found' | 'not-found' | 'error';

export const StepAddress = ({ street, coords, onChangeStreet, onChangeCoords }: StepAddressProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');

  const handleSearch = async () => {
    if (!street.trim()) return;
    setIsSearching(true);
    setStatus('idle');
    try {
      const result = await geocodeAddress(street);
      if (result) {
        onChangeCoords({ lat: result.lat, lng: result.lng });
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.step}>
      <h2>Su ubicación</h2>
      <p className={styles.hint}>Esta dirección se usará para calcular distancias en tutorías presenciales.</p>

      <div className={styles.addressSearch}>
        <Input
          label="Descripción de la dirección"
          value={street}
          onChange={(e) => { onChangeStreet(e.target.value); setStatus('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
          placeholder="Ej: Zona 10, Ciudad de Guatemala"
          required
        />
        <Button type="button" variant="secondary" size="sm" onClick={handleSearch} isLoading={isSearching}>
          <Search aria-hidden="true" /> Ubicar en el mapa
        </Button>
      </div>

      {status === 'found' && (
        <p className={styles.searchOk}><CheckCircle2 aria-hidden="true" /> Dirección encontrada — el pin se movió a esa ubicación.</p>
      )}
      {status === 'not-found' && (
        <p className={styles.searchWarn}><AlertTriangle aria-hidden="true" /> No se encontró esa dirección. Ajuste el pin manualmente abajo.</p>
      )}
      {status === 'error' && (
        <p className={styles.searchWarn}><AlertTriangle aria-hidden="true" /> No se pudo buscar en este momento. Ajuste el pin manualmente.</p>
      )}

      <p className={styles.label}>O ajuste el pin directamente en el mapa (arrástrelo):</p>
      <MapPicker value={coords} onChange={onChangeCoords} height="350px" />
      <p className={styles.coords}>
        Coordenadas: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
      </p>
    </div>
  );
};
