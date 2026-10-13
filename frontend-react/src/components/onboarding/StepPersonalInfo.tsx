import { Input } from '../ui/Input';
import type { OnboardingData } from '../../hooks/useOnboardingWizard';
import styles from '../../pages/onboarding/Onboarding.module.scss';

const GENDER_LABELS: Record<'M' | 'F' | 'other', string> = {
  M: 'Masculino',
  F: 'Femenino',
  other: 'Otro',
};

interface StepPersonalInfoProps {
  userName?: string;
  isTutor: boolean;
  phone: string;
  gender: OnboardingData['gender'];
  onChangePhone: (value: string) => void;
  onChangeGender: (value: OnboardingData['gender']) => void;
}

export const StepPersonalInfo = ({ userName, isTutor, phone, gender, onChangePhone, onChangeGender }: StepPersonalInfoProps) => (
  <div className={styles.step}>
    <h2>Bienvenido/a{userName ? `, ${userName}` : ''}</h2>
    <p className={styles.hint}>
      Complete su perfil en {isTutor ? 4 : 3} pasos rápidos. Empecemos por sus datos de contacto.
    </p>

    <Input
      label="Teléfono / WhatsApp"
      value={phone}
      onChange={(e) => onChangePhone(e.target.value)}
      placeholder="+502 5555-1234"
      required
    />
    <div className={styles.field}>
      <label className={styles.label}>Género</label>
      <div className={styles.radioGroup}>
        {(Object.keys(GENDER_LABELS) as Array<'M' | 'F' | 'other'>).map((g) => (
          <label key={g} className={styles.radioOption}>
            <input
              type="radio"
              checked={gender === g}
              onChange={() => onChangeGender(g)}
            />
            {GENDER_LABELS[g]}
          </label>
        ))}
      </div>
    </div>
  </div>
);
