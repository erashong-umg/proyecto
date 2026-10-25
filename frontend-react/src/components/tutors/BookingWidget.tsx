import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAvailability } from '../../hooks/useAvailability';
import { useTripRoute } from '../../hooks/useTripRoute';
import { Button } from '../ui/Button';
import { RouteMap } from './RouteMap';
import { calculateTripPrice, haversineKm } from '../../services/geo';
import { formatQ, minuteToHHMM, dayOfWeekLabel } from '../../services/formatters';
import api, { getErrorMessage } from '../../services/api';
import type { TutorProfileCourse, TutorSummary, Modality } from '../../types/api';
import inputStyles from '../ui/Input.module.scss';
import styles from './BookingWidget.module.scss';

const MODALITY_LABELS: Record<Modality, string> = {
  virtual: 'Virtual',
  'presencial-tutor': 'En casa del tutor',
  'presencial-estudiante': 'A domicilio del estudiante',
};

const DURATIONS = [60, 90, 120];

interface BookingWidgetProps {
  tutor: TutorSummary;
  courses: TutorProfileCourse[];
}

export const BookingWidget = ({ tutor, courses }: BookingWidgetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availability } = useAvailability(tutor._id);

  const [courseId, setCourseId] = useState(courses[0]?._id ?? '');
  const course = courses.find((c) => c._id === courseId);

  const [modality, setModality] = useState<Modality>(course?.modalities[0] ?? 'virtual');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isVirtual = modality === 'virtual';
  const today = new Date().toISOString().slice(0, 10);

  const dayOfWeek = date ? new Date(`${date}T00:00:00`).getDay() : undefined;

  const availableTimes = useMemo(() => {
    if (isVirtual || dayOfWeek === undefined || !availability) return [];
    const slots = availability.slots.filter((s) => s.dayOfWeek === dayOfWeek);
    const times: number[] = [];
    for (const slot of slots) {
      for (let m = slot.startMinute; m + durationMin <= slot.endMinute; m += 30) {
        times.push(m);
      }
    }
    return times;
  }, [isVirtual, dayOfWeek, availability, durationMin]);

  // Traslado a domicilio: ruta real por calles (backend) entre el tutor y el
  // domicilio del estudiante. Mientras llega, o si falla, se muestra una
  // estimación en línea recta; el backend recalcula el precio al reservar.
  const tutorCoords = tutor.address?.coords;
  const studentCoords = user?.address?.coords;
  const needsRoute = modality === 'presencial-estudiante';
  const routeEnabled = needsRoute && !!tutorCoords && !!studentCoords;
  const { route, isLoading: routeLoading } = useTripRoute(
    routeEnabled ? tutorCoords : undefined,
    routeEnabled ? studentCoords : undefined
  );
  const distanceKm = routeEnabled ? (route?.distanceKm ?? haversineKm(tutorCoords!, studentCoords!)) : undefined;
  const isEstimate = routeEnabled && route?.source !== 'osrm';

  const priceBreakdown = course
    ? calculateTripPrice(course.baseRate, course.ratePerKm, durationMin / 60, distanceKm)
    : null;

  let routeCaption = '';
  if (routeLoading) routeCaption = 'Calculando ruta…';
  else if (route?.source === 'osrm') {
    routeCaption = `Ruta por calles: ${route.distanceKm} km${route.durationMin ? ` · aprox. ${route.durationMin} min en auto` : ''}`;
  } else if (distanceKm !== undefined) {
    routeCaption = `No se pudo obtener la ruta por calles; se muestra la línea recta (${Math.round(distanceKm * 100) / 100} km).`;
  }

  const canSubmit = course && date && (isVirtual ? time : time !== '');

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const next = courses.find((c) => c._id === id);
    if (next && !next.modalities.includes(modality)) setModality(next.modalities[0]);
    setTime('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !date || !time) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const startsAt = new Date(`${date}T${time}:00`);
      await api.post('/bookings', {
        tutorId: tutor._id,
        courseId: course._id,
        startsAt: startsAt.toISOString(),
        durationMin,
        modality,
        repeatWeeks,
      });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la reserva.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (courses.length === 0) return null;

  if (success) {
    return (
      <div className={styles.success}>
        <CheckCircle2 aria-hidden="true" />
        <div>
          <p className={styles.successTitle}>Reserva confirmada</p>
          <p>Puede verla y gestionarla desde "Mis reservas".</p>
        </div>
        <Button size="sm" onClick={() => navigate('/mis-reservas')}>Ver mis reservas</Button>
      </div>
    );
  }

  return (
    <form className={styles.widget} onSubmit={handleSubmit}>
      <h2><CalendarClock aria-hidden="true" /> Reservar una tutoría</h2>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="b-course">Curso</label>
          <select id="b-course" className={inputStyles.input} value={courseId} onChange={(e) => handleCourseChange(e.target.value)}>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="b-modality">Modalidad</label>
          <select
            id="b-modality"
            className={inputStyles.input}
            value={modality}
            onChange={(e) => { setModality(e.target.value as Modality); setTime(''); }}
          >
            {course?.modalities.map((m) => <option key={m} value={m}>{MODALITY_LABELS[m]}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="b-duration">Duración</label>
          <select id="b-duration" className={inputStyles.input} value={durationMin} onChange={(e) => { setDurationMin(Number(e.target.value)); setTime(''); }}>
            {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="b-date">Fecha</label>
          <input
            id="b-date"
            type="date"
            min={today}
            className={inputStyles.input}
            value={date}
            onChange={(e) => { setDate(e.target.value); setTime(''); }}
          />
        </div>

        {isVirtual ? (
          <div className={styles.field}>
            <label htmlFor="b-time">Hora</label>
            <input
              id="b-time"
              type="time"
              className={inputStyles.input}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor="b-time">Hora</label>
            <select
              id="b-time"
              className={inputStyles.input}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!date || availableTimes.length === 0}
            >
              <option value="">
                {!date ? 'Elija una fecha' : availableTimes.length === 0 ? 'Sin horarios ese día' : 'Seleccionar'}
              </option>
              {availableTimes.map((m) => (
                <option key={m} value={minuteToHHMM(m)}>{minuteToHHMM(m)}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="b-repeat">Repetir semanalmente</label>
          <select id="b-repeat" className={inputStyles.input} value={repeatWeeks} onChange={(e) => setRepeatWeeks(Number(e.target.value))}>
            <option value={1}>No repetir</option>
            {[2, 3, 4, 6, 8, 12].map((n) => <option key={n} value={n}>{n} semanas</option>)}
          </select>
        </div>
      </div>

      {!isVirtual && date && dayOfWeek !== undefined && availableTimes.length === 0 && (
        <p className={styles.hint}>El tutor no tiene disponibilidad los {dayOfWeekLabel(dayOfWeek).toLowerCase()}s (con esa duración).</p>
      )}

      {needsRoute && !studentCoords && (
        <p className={styles.hint}>Complete la dirección de su perfil para calcular el traslado a su domicilio.</p>
      )}

      {routeEnabled && tutorCoords && studentCoords && (
        <div className={styles.routeBlock}>
          <RouteMap tutor={tutorCoords} student={studentCoords} tutorName={tutor.name} route={route} />
          <p className={styles.routeCaption} aria-live="polite">{routeCaption}</p>
        </div>
      )}

      {priceBreakdown && (
        <div className={styles.priceBreakdown}>
          <div><span>Tutoría ({durationMin} min)</span><span>{formatQ(priceBreakdown.baseAmount)}</span></div>
          {priceBreakdown.transportAmount > 0 && (
            <div><span>Traslado ({priceBreakdown.distanceKm} km{isEstimate ? ', estimado' : ''})</span><span>{formatQ(priceBreakdown.transportAmount)}</span></div>
          )}
          <div className={styles.priceTotal}><span>Total {repeatWeeks > 1 ? `× ${repeatWeeks} semanas` : ''}</span><span>{formatQ(priceBreakdown.total)}</span></div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting}>Confirmar reserva</Button>
    </form>
  );
};
