import { Input } from '../ui/Input';
import styles from '../../pages/onboarding/Onboarding.module.scss';

interface StepTutorInfoProps {
  bio: string;
  cvUrl: string;
  portfolioUrl: string;
  baseRate: number;
  ratePerKm: number;
  onChangeBio: (value: string) => void;
  onChangeCvUrl: (value: string) => void;
  onChangePortfolioUrl: (value: string) => void;
  onChangeBaseRate: (value: number) => void;
  onChangeRatePerKm: (value: number) => void;
}

export const StepTutorInfo = ({
  bio, cvUrl, portfolioUrl, baseRate, ratePerKm,
  onChangeBio, onChangeCvUrl, onChangePortfolioUrl, onChangeBaseRate, onChangeRatePerKm,
}: StepTutorInfoProps) => (
  <div className={styles.step}>
    <h2>Información profesional</h2>
    <div className={styles.field}>
      <label className={styles.label}>Biografía profesional</label>
      <textarea
        value={bio}
        onChange={(e) => onChangeBio(e.target.value)}
        className={styles.textarea}
        rows={4}
        placeholder="Cuéntele a los estudiantes su experiencia y metodología."
        required
      />
    </div>
    <Input
      label="URL de CV / Portafolio (LinkedIn o personal)"
      value={cvUrl}
      onChange={(e) => onChangeCvUrl(e.target.value)}
      placeholder="https://linkedin.com/in/usuario"
      required
    />
    <Input
      label="URL de portafolio (opcional)"
      value={portfolioUrl}
      onChange={(e) => onChangePortfolioUrl(e.target.value)}
      placeholder="https://mi-portafolio.com"
    />
    <div className={styles.field}>
      <label className={styles.label}>Tarifa base por hora (Q)</label>
      <input
        type="number"
        value={baseRate}
        onChange={(e) => onChangeBaseRate(Number(e.target.value))}
        min={1}
        className={styles.numberInput}
        required
      />
    </div>
    <div className={styles.field}>
      <label className={styles.label}>Tarifa adicional por kilómetro de traslado (Q/km, solo presencial)</label>
      <input
        type="number"
        value={ratePerKm}
        onChange={(e) => onChangeRatePerKm(Number(e.target.value))}
        min={0}
        step={0.5}
        className={styles.numberInput}
      />
    </div>
    <p className={styles.note}>
      Su cuenta estará en estado "pendiente de aprobación" hasta que un administrador valide su perfil.
    </p>
  </div>
);
