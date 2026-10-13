import { useEffect, useRef, useState } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface UseGeolocationResult {
  coords: Coords | undefined;
  isLocating: boolean;
  error: string | null;
  source: 'gps' | 'saved' | null;
  hasFallback: boolean;
  retry: () => void;
  useSavedLocation: () => void;
}

/**
 * Ubicación real del navegador (prerrequisito del flujo de búsqueda tipo
 * InDrive). Si el usuario niega el permiso o el navegador no lo soporta,
 * cae a la dirección guardada en el onboarding en vez de dejar la búsqueda
 * sin ubicación — mejor eso que un callejón sin salida.
 *
 * Nota real (no solo de prueba): mientras el diálogo nativo de permiso está
 * sin responder, ni el callback de éxito ni el de error se disparan — y
 * `PositionOptions.timeout` NO corre durante ese tiempo (confirmado
 * empíricamente). Un usuario que tarda en decidir, o cuyo diálogo quedó
 * detrás de otra ventana, se queda esperando indefinidamente sin
 * `useSavedLocation` como salida manual.
 */
export const useGeolocation = (fallback?: Coords): UseGeolocationResult => {
  const [coords, setCoords] = useState<Coords | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'gps' | 'saved' | null>(null);
  const [attempt, setAttempt] = useState(0);
  const settledRef = useRef(false);

  useEffect(() => {
    settledRef.current = false;

    if (!navigator.geolocation) {
      if (fallback) {
        setCoords(fallback);
        setSource('saved');
        setError(null);
      } else {
        setError('Este navegador no admite geolocalización.');
      }
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settledRef.current) return;
        settledRef.current = true;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSource('gps');
        setIsLocating(false);
      },
      () => {
        if (settledRef.current) return;
        settledRef.current = true;
        if (fallback) {
          setCoords(fallback);
          setSource('saved');
          setError(null);
        } else {
          setError('No se pudo obtener su ubicación. Active los permisos de ubicación e intente de nuevo.');
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const useSavedLocation = () => {
    if (!fallback) return;
    settledRef.current = true;
    setCoords(fallback);
    setSource('saved');
    setError(null);
    setIsLocating(false);
  };

  return {
    coords,
    isLocating,
    error,
    source,
    hasFallback: !!fallback,
    retry: () => setAttempt((n) => n + 1),
    useSavedLocation,
  };
};
