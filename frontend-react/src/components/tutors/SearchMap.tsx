import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TutorSummary } from '../../types/api';
import styles from './SearchMap.module.scss';

const TUTOR_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
  <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="#dc541a"/>
  <circle cx="15" cy="15" r="6" fill="#f7f8f6"/>
</svg>`;

const tutorIcon = L.icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(TUTOR_PIN_SVG)}`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

const userIcon = L.divIcon({
  className: styles.userMarker,
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface SearchMapProps {
  userCoords: { lat: number; lng: number };
  tutors: TutorSummary[];
  selectedTutorId: string | null;
  onSelectTutor: (id: string) => void;
}

export const SearchMap = ({ userCoords, tutors, selectedTutorId, onSelectTutor }: SearchMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tutorMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelectTutor);
  onSelectRef.current = onSelectTutor;

  // Inicializa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([userCoords.lat, userCoords.lng], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // Ver nota en MapPicker.tsx: CARTO Positron raster exige API key en la
    // práctica pese a lo esperado — volviendo a OSM estándar (sin key).
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin del usuario — se recrea (no se reposiciona) en cada cambio de coords,
  // y se limpia en el cleanup. Necesario para que StrictMode (que monta y
  // desmonta los efectos dos veces en desarrollo) no deje un marcador
  // huérfano apuntando a un mapa ya destruido.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const marker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    return () => {
      map.removeLayer(marker);
    };
  }, [userCoords.lat, userCoords.lng]);

  // Pines de tutores — se reconstruyen enteros en cada búsqueda nueva y se
  // limpian en el cleanup (mismo motivo que el pin de usuario).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = new Map<string, L.Marker>();
    tutors.forEach((tutor, i) => {
      if (!tutor.address?.coords) return;
      const marker = L.marker([tutor.address.coords.lat, tutor.address.coords.lng], { icon: tutorIcon })
        .on('click', () => onSelectRef.current(tutor._id));
      marker.addTo(map);
      marker.bindPopup(`<strong>${tutor.name}</strong>`);
      const el = marker.getElement();
      if (el) {
        el.classList.add(styles.dropIn);
        el.style.animationDelay = `${i * 60}ms`;
      }
      markers.set(tutor._id, marker);
    });
    tutorMarkersRef.current = markers;

    if (tutors.length > 0) {
      const bounds = L.latLngBounds([[userCoords.lat, userCoords.lng]]);
      tutors.forEach((t) => { if (t.address?.coords) bounds.extend([t.address.coords.lat, t.address.coords.lng]); });
      // Padding asimétrico: el panel flotante ocupa la izquierda, así que
      // sin esto los puntos cercanos al borde izquierdo (a veces el propio
      // usuario) quedan tapados detrás del panel en vez de visibles.
      const isDesktop = window.innerWidth >= 768;
      map.fitBounds(bounds, {
        paddingTopLeft: [isDesktop ? 420 : 40, 60],
        paddingBottomRight: [60, isDesktop ? 60 : 260],
        maxZoom: 15,
      });
    }

    return () => {
      markers.forEach((m) => map.removeLayer(m));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutors]);

  // Resalta el marcador seleccionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTutorId) return;
    const marker = tutorMarkersRef.current.get(selectedTutorId);
    if (marker) {
      map.panTo(marker.getLatLng());
      marker.openPopup();
    }
  }, [selectedTutorId]);

  return <div ref={containerRef} className={styles.map} />;
};
