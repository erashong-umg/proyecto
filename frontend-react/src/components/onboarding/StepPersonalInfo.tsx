import { Input } from '../ui/Input';
import type { OnboardingData } from '../../hooks/useOnboardingWizard';
import { ID_DOCUMENT_LABELS, normalizeIdNumber, type IdDocumentType } from '../../services/idDocument';
import styles from '../../pages/onboarding/Onboarding.module.scss';

const GENDER_LABELS: Record<'M' | 'F' | 'other', string> = {
  M: 'Masculino',
  F: 'Femenino',
  other: 'Otro',
};

const DPI_LENGTH = 13;
const ID_PRIVACY_HINT = 'Lo usamos para verificar su identidad. Solo lo ve el equipo de administración.';

// Error en vivo: solo cuando ya escribió algo que no puede ser válido.
const idError = (type: IdDocumentType, value: string): string | undefined => {
  const number = normalizeIdNumber(value);
  if (!number) return undefined;
  if (type === 'dpi') {
    if (!/^\d+$/.test(number)) return 'El DPI solo lleva números.';
    if (number.length > DPI_LENGTH) return `Sobran ${number.length - DPI_LENGTH} dígitos: el DPI tiene ${DPI_LENGTH}.`;
    return undefined;
  }
  if (!/^[A-Z0-9]+$/.test(number)) return 'El pasaporte solo lleva letras y números.';
  if (number.length > 20) return 'El pasaporte tiene como máximo 20 caracteres.';
  return undefined;
};

// Contador visible de lo que falta, o confirmación cuando ya está completo.
const idHint = (type: IdDocumentType, value: string): string => {
  const length = normalizeIdNumber(value).length;
  if (type === 'dpi') {
    if (length === 0) return `El DPI tiene ${DPI_LENGTH} dígitos. ${ID_PRIVACY_HINT}`;
    if (length < DPI_LENGTH) return `${length}/${DPI_LENGTH} dígitos: faltan ${DPI_LENGTH - length}.`;
    if (length === DPI_LENGTH) return `${DPI_LENGTH}/${DPI_LENGTH} dígitos ✓`;
  } else {
    if (length === 0) return `Entre 6 y 20 letras o números. ${ID_PRIVACY_HINT}`;
    if (length < 6) return `Faltan al menos ${6 - length} caracteres (mínimo 6).`;
  }
  return ID_PRIVACY_HINT;
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
      Complete su perfil en {isTutor ? 3 : 2} pasos rápidos. Empecemos por usted.
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
      pattern={idType === 'dpi' ? '[0-9\\s\\-]{13,17}' : '[A-Za-z0-9\\s\\-]{6,24}'}
      maxLength={idType === 'dpi' ? 17 : 24}
      title={idType === 'dpi' ? 'El DPI tiene 13 dígitos' : 'El pasaporte tiene entre 6 y 20 letras o números'}
      error={idError(idType, idNumber)}
      hint={idHint(idType, idNumber)}
      required
    />
  </div>
);
