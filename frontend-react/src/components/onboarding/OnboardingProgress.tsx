import { Check } from 'lucide-react';
import type { OnboardingStep } from '../../hooks/useOnboardingWizard';
import styles from '../../pages/onboarding/Onboarding.module.scss';

const ALL_STEPS: { n: OnboardingStep; label: string; tutorOnly?: boolean }[] = [
  { n: 1, label: 'Datos personales' },
  { n: 2, label: 'Ubicación' },
  { n: 3, label: 'Info. profesional', tutorOnly: true },
  { n: 4, label: 'Intereses' },
];

interface OnboardingProgressProps {
  step: OnboardingStep;
  isTutor: boolean;
}

export const OnboardingProgress = ({ step, isTutor }: OnboardingProgressProps) => {
  // Lista de pasos que ESTA persona realmente va a ver. Para un estudiante,
  // "Info. profesional" ni existe en su recorrido — numerar por posición acá
  // (1, 2, 3) en vez del número absoluto del paso maestro (1, 2, 4) evita
  // que el rail muestre un salto que parece un error.
  const steps = ALL_STEPS.filter((s) => !s.tutorOnly || isTutor);
  const currentIndex = steps.findIndex((s) => s.n === step);
  const total = steps.length;

  return (
    <>
      {/* Rail vertical — desktop */}
      <nav className={styles.rail} aria-label="Progreso del registro">
        <ol className={styles.railList}>
          {steps.map((s, i) => {
            const status = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
            return (
              <li key={s.n} className={styles.railItem} data-status={status}>
                <span className={styles.railDot}>
                  {status === 'done' ? <Check aria-hidden="true" /> : i + 1}
                </span>
                <span className={styles.railLabel}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Barra horizontal — mobile */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ transform: `scaleX(${(currentIndex + 1) / total})` }} />
        </div>
        <p className={styles.stepLabel}>Paso {currentIndex + 1} de {total}</p>
      </div>
    </>
  );
};
