import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Video, Home, MapPinned } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFreeSlots } from '../../hooks/useFreeSlots';
import { useTripRoute } from '../../hooks/useTripRoute';
import { Button } from '../ui/Button';
import { RouteMap } from './RouteMap';
import { calculateTripPrice, haversineKm } from '../../services/geo';
import { formatLongDate, formatQ } from '../../services/formatters';
import api, { getErrorMessage } from '../../services/api';
import inputStyles from '../ui/Input.module.scss';
import type { FreeSlot, Modality, TutorProfileCourse, TutorSummary } from '../../types/api';
import styles from './BookingWizard.module.scss';

const MODALITY_LABELS: Record<Modality, string> = {
  virtual: 'Virtual',
  'presencial-tutor': 'En casa del tutor',
  'presencial-estudiante': 'A domicilio del estudiante',
};

const MODALITY_ICONS: Record<Modality, typeof Video> = {
  virtual: Video,
  'presencial-tutor': Home,
  'presencial-estudiante': MapPinned,
};

const DURATIONS = [60, 90, 120];

// Una sola vez, o suscripción semanal de 4 u 8 semanas (lo que pide el enunciado).
const REPEATS: { value: number; label: string }[] = [
  { value: 1, label: 'Una sola vez' },
  { value: 4, label: 'Cada semana, 4 semanas' },
  { value: 8, label: 'Cada semana, 8 semanas' },
];

const STEPS = ['Qué', 'Cuándo', 'Confirmar'] as const;
type Step = 1 | 2 | 3;

// Fecha local de hoy como AAAA-MM-DD (toISOString daría la de UTC, que puede ser mañana).
const todayKey = (): string => new Date().toLocaleDateString('en-CA');

interface BookingWizardProps {
  tutor: TutorSummary;
  courses: TutorProfileCourse[];
}

/**
 * Reserva en tres pasos: qué (curso, modalidad, duración), cuándo (fecha y una
 * hora de las realmente libres) y confirmar (resumen, ruta y precio).
 */
export const BookingWizard = ({ tutor, courses }: BookingWizardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [courseId, setCourseId] = useState(courses[0]?._id ?? '');
  const course = courses.find((c) => c._id === courseId);
  const [modality, setModality] = useState<Modality>(course?.modalities[0] ?? 'virtual');
  const [durationMin, setDurationMin] = useState(60);
  const [date, setDate] = useState('');
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [slot, setSlot] = useState<FreeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { slots, isLoading: slotsLoading, failed: slotsFailed } = useFreeSlots(tutor._id, date, durationMin, repeatWeeks);

  // Traslado a domicilio: ruta real por calles; mientras llega (o si falla) se
  // estima en línea recta. El backend recalcula el precio al reservar.
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
  const price = course ? calculateTripPrice(course.baseRate, course.ratePerKm, durationMin / 60, distanceKm) : null;

  let routeCaption = '';
  if (routeLoading) routeCaption = 'Calculando ruta…';
  else if (route?.source === 'osrm') {
    routeCaption = `Ruta por calles: ${route.distanceKm} km${route.durationMin ? ` · aprox. ${route.durationMin} min en auto` : ''}`;
  } else if (distanceKm !== undefined) {
    routeCaption = `No se pudo obtener la ruta por calles; se muestra la línea recta (${Math.round(distanceKm * 100) / 100} km).`;
  }

  const changeCourse = (id: string) => {
    setCourseId(id);
    const next = courses.find((c) => c._id === id);
    if (next && !next.modalities.includes(modality)) setModality(next.modalities[0]);
  };

  // Cambiar duración, fecha o repetición cambia qué horas están libres.
  const resetSlot = () => setSlot(null);

  const handleConfirm = async () => {
    if (!course || !slot) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/bookings', {
        tutorId: tutor._id,
        courseId: course._id,
        startsAt: slot.startsAt,
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

  const ModalityIcon = MODALITY_ICONS[modality];
  const missingAddress = needsRoute && !studentCoords;

  return (
    <section className={styles.wizard} aria-label="Reservar una tutoría" data-tour="booking-widget">
      <h2><CalendarClock aria-hidden="true" /> Reservar una tutoría</h2>

      <ol className={styles.steps} aria-label="Pasos de la reserva">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`${styles.stepItem} ${step === i + 1 ? styles.stepCurrent : ''} ${step > i + 1 ? styles.stepDone : ''}`}
            aria-current={step === i + 1 ? 'step' : undefined}
          >
            <span className={styles.stepNumber}>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {/* ---- Paso 1: qué ---- */}
      {step === 1 && (
        <div className={styles.body}>
          {courses.length > 1 && (
            <div className={styles.field}>
              <label htmlFor="bw-course">Curso</label>
              <select id="bw-course" className={inputStyles.input} value={courseId} onChange={(e) => changeCourse(e.target.value)}>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}
          {courses.length === 1 && <p className={styles.courseName}>{course?.title}</p>}

          <fieldset className={styles.field}>
            <legend>Modalidad</legend>
            <div className={styles.choices}>
              {course?.modalities.map((m) => {
                const Icon = MODALITY_ICONS[m];
                return (
                  <label key={m} className={`${styles.choice} ${modality === m ? styles.choiceOn : ''}`}>
                    <input type="radio" name="bw-modality" checked={modality === m} onChange={() => setModality(m)} />
                    <Icon aria-hidden="true" /> {MODALITY_LABELS[m]}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={styles.field}>
            <legend>Duración</legend>
            <div className={styles.choices}>
              {DURATIONS.map((d) => (
                <label key={d} className={`${styles.choice} ${durationMin === d ? styles.choiceOn : ''}`}>
                  <input
                    type="radio"
                    name="bw-duration"
                    checked={durationMin === d}
                    onChange={() => { setDurationMin(d); resetSlot(); }}
                  />
                  {d} min
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.nav}>
            <span />
            <Button onClick={() => setStep(2)} disabled={!course}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* ---- Paso 2: cuándo ---- */}
      {step === 2 && (
        <div className={styles.body}>
          <div className={styles.field}>
            <label htmlFor="bw-date">Fecha</label>
            <input
              id="bw-date"
              type="date"
              min={todayKey()}
              className={inputStyles.input}
              value={date}
              onChange={(e) => { setDate(e.target.value); resetSlot(); }}
            />
          </div>

          <fieldset className={styles.field}>
            <legend>¿Se repite?</legend>
            <div className={styles.choices}>
              {REPEATS.map((r) => (
                <label key={r.value} className={`${styles.choice} ${repeatWeeks === r.value ? styles.choiceOn : ''}`}>
                  <input
                    type="radio"
                    name="bw-repeat"
                    checked={repeatWeeks === r.value}
                    onChange={() => { setRepeatWeeks(r.value); resetSlot(); }}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.field}>
            <legend>Hora de inicio</legend>
            {!date ? (
              <p className={styles.hint}>Elija una fecha para ver las horas libres.</p>
            ) : slotsLoading ? (
              <p className={styles.hint}>Buscando horarios…</p>
            ) : slotsFailed ? (
              <p className={styles.error}>No se pudieron cargar los horarios. Intente de nuevo.</p>
            ) : slots.length === 0 ? (
              <p className={styles.hint}>
                {repeatWeeks > 1
                  ? 'No hay una hora libre todas esas semanas ese día. Pruebe otro día o reserve una sola vez.'
                  : 'El tutor no tiene horas libres ese día. Pruebe otra fecha.'}
              </p>
            ) : (
              <div className={styles.slots} role="radiogroup" aria-label="Horas disponibles">
                {slots.map((s) => (
                  <button
                    key={s.startsAt}
                    type="button"
                    role="radio"
                    aria-checked={slot?.startsAt === s.startsAt}
                    className={`${styles.slot} ${slot?.startsAt === s.startsAt ? styles.slotOn : ''}`}
                    onClick={() => setSlot(s)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <div className={styles.nav}>
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)} disabled={!slot}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* ---- Paso 3: confirmar ---- */}
      {step === 3 && course && slot && (
        <div className={styles.body}>
          <dl className={styles.summary}>
            <div><dt>Curso</dt><dd>{course.title}</dd></div>
            <div><dt>Modalidad</dt><dd><ModalityIcon aria-hidden="true" /> {MODALITY_LABELS[modality]}</dd></div>
            <div>
              <dt>Cuándo</dt>
              <dd>{formatLongDate(new Date(`${date}T12:00:00`))}, {slot.label} ({durationMin} min)</dd>
            </div>
            {repeatWeeks > 1 && <div><dt>Repetición</dt><dd>Cada semana durante {repeatWeeks} semanas</dd></div>}
          </dl>

          {missingAddress && (
            <p className={styles.hint}>Complete la dirección de su perfil para calcular el traslado a su domicilio.</p>
          )}

          {routeEnabled && tutorCoords && studentCoords && (
            <div className={styles.routeBlock}>
              <RouteMap tutor={tutorCoords} student={studentCoords} tutorName={tutor.name} route={route} />
              <p className={styles.routeCaption} aria-live="polite">{routeCaption}</p>
            </div>
          )}

          {price && (
            <div className={styles.price}>
              <div><span>Tutoría ({durationMin} min)</span><span>{formatQ(price.baseAmount)}</span></div>
              {(price.transportAmount ?? 0) > 0 && (
                <div>
                  <span>Traslado ({price.distanceKm} km{isEstimate ? ', estimado' : ''})</span>
                  <span>{formatQ(price.transportAmount ?? 0)}</span>
                </div>
              )}
              <div className={styles.priceTotal}>
                <span>{repeatWeeks > 1 ? 'Por sesión' : 'Total'}</span>
                <span>{formatQ(price.total)}</span>
              </div>
              {repeatWeeks > 1 && (
                <div className={styles.priceTotal}>
                  <span>Total × {repeatWeeks} semanas</span>
                  <span>{formatQ(Math.round(price.total * repeatWeeks * 100) / 100)}</span>
                </div>
              )}
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.nav}>
            <Button variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting}>Atrás</Button>
            <Button onClick={handleConfirm} isLoading={isSubmitting} disabled={missingAddress}>Confirmar reserva</Button>
          </div>
        </div>
      )}
    </section>
  );
};
