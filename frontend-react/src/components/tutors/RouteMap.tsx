import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteInfo } from '../../types/api';
import styles from './RouteMap.module.scss';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteMapProps {
  tutor: LatLng;
  student: LatLng;
  tutorName: string;
  route: RouteInfo | null;
}

const pin = (label: string, className: string) =>
  L.divIcon({
    className: '',
    html: `<span class="${className}">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

// Mapa con la trayectoria entre el tutor y el domicilio del estudiante. Sin
// `route` (cargando o sin respuesta) muestra solo los dos puntos.
export const RouteMap = ({ tutor, student, tutorName, route }: RouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points: L.LatLngExpression[] = route?.path ?? [[tutor.lat, tutor.lng], [student.lat, student.lng]];

    if (route) {
      // Trazo continuo si es ruta por calles; punteado si es solo línea recta.
      L.polyline(route.path, {
        color: '#dc541a',
        weight: 5,
        opacity: 0.85,
        dashArray: route.source === 'osrm' ? undefined : '8 10',
      }).addTo(layer);
    }
    L.marker([tutor.lat, tutor.lng], { icon: pin('T', styles.pinTutor), title: tutorName })
      .bindTooltip(`Tutor: ${tutorName}`)
      .addTo(layer);
    L.marker([student.lat, student.lng], { icon: pin('Yo', styles.pinStudent), title: 'Su domicilio' })
      .bindTooltip('Su domicilio')
      .addTo(layer);

    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
  }, [tutor.lat, tutor.lng, student.lat, student.lng, tutorName, route]);

  return (
    <div
      ref={containerRef}
      className={styles.map}
      role="img"
      aria-label={`Mapa con la ruta entre ${tutorName} y su domicilio`}
    />
  );
};
