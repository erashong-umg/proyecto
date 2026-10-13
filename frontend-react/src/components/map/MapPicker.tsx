import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pin propio (verde quetzal) en vez del marcador azul default de Leaflet —
// evita además la dependencia de las imágenes servidas desde unpkg.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#dc1a1a"/>
  <circle cx="16" cy="16" r="6.5" fill="#f7f8f6"/>
</svg>`;

const quetzalPin = L.icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(PIN_SVG)}`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
});

interface MapPickerProps {
  value: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
}

export const MapPicker = ({ value, onChange, height = '400px' }: MapPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([value.lat, value.lng], 13);

    // Nota: se intentó CARTO Positron para un estilo más minimalista, pero
    // su endpoint de teselas raster ahora exige API key (comprobado en vivo:
    // watermark "API KEY REQUIRED") — a pesar de la documentación pública
    // que sugiere lo contrario. Volviendo a OSM estándar, confirmado sin key.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([value.lat, value.lng], { draggable: true, icon: quetzalPin }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeRef.current({ lat: pos.lat, lng: pos.lng });
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Solo se inicializa una vez; value inicial se usa como punto de partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar el marcador si cambia el valor desde fuera
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: '8px' }} />;
};
