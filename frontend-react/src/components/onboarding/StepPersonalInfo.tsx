import { Input } from '../ui/Input';
import type { OnboardingData } from '../../hooks/useOnboardingWizard';
import { ID_DOCUMENT_LABELS, type IdDocumentType } from '../../services/idDocument';
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
  idType: IdDocumentType;
  idNumber: string;
  onChangePhone: (value: string) => void;
  onChangeGender: (value: OnboardingData['gender']) => void;
  onChangeIdType: (value: IdDocumentType) => void;
  onChangeIdNumber: (value: string) => void;
}

export const StepPersonalInfo = ({
  userName, isTutor, phone, gender, idType, idNumber,
  onChangePhone, onChangeGender, onChangeIdType, onChangeIdNumber,
}: StepPersonalInfoProps) => (
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

    <div className={styles.field}>
      <label className={styles.label}>Documento de identificación</label>
      <div className={styles.radioGroup}>
        {(Object.keys(ID_DOCUMENT_LABELS) as IdDocumentType[]).map((type) => (
          <label key={type} className={styles.radioOption}>
            <input
              type="radio"
              name="id-document-type"
              checked={idType === type}
              onChange={() => onChangeIdType(type)}
            />
            {ID_DOCUMENT_LABELS[type]}
          </label>
        ))}
      </div>
    </div>
    <Input
      label={`Número de ${ID_DOCUMENT_LABELS[idType]}`}
      value={idNumber}
      onChange={(e) => onChangeIdNumber(e.target.value)}
      inputMode={idType === 'dpi' ? 'numeric' : 'text'}
      autoComplete="off"
      placeholder={idType === 'dpi' ? '1234 56789 0101' : 'AB123456'}
      hint="Lo usamos para verificar su identidad. Solo lo ve el equipo de administración."
      required
    />
  </div>
);
