import { useId, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { INVARIANT_FIELDS, REACTIVE_FIELDS } from '../../types/theme';
import styles from './Appearance.module.scss';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
  const inputId = useId();
  const isValid = value === '' || HEX_PATTERN.test(value);

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.fieldControls}>
        <input
          type="color"
          aria-label={`Selector de color para ${label}`}
          value={isValid && value ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className={styles.swatch}
        />
        <input
          id={inputId}
          type="text"
          value={value}
          placeholder="#rrggbb"
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.hexInput} ${!isValid ? styles.hexInputError : ''}`}
        />
      </div>
      {!isValid && <p className={styles.fieldError}>Formato inválido, use #rrggbb.</p>}
    </div>
  );
};

export const AdminAppearancePage = () => {
  const { draft, isLoading, isSaving, error, success, setField, save, reset } = useAdminTheme();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleReset = async () => {
    const ok = await reset();
    if (ok) setConfirmResetOpen(false);
  };

  if (isLoading) return <p className={styles.status}>Cargando tema actual…</p>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2><Palette aria-hidden="true" /> Apariencia</h2>
          <p className={styles.subtitle}>
            Personalice la paleta de colores de toda la plataforma. Los cambios se aplican de
            inmediato para los 3 roles (estudiante, tutor y administrador), en páginas públicas y
            privadas.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={() => setConfirmResetOpen(true)} disabled={isSaving}>
            <RotateCcw aria-hidden="true" /> Restablecer
          </Button>
          <Button onClick={save} isLoading={isSaving}>Guardar cambios</Button>
        </div>
      </div>

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}
      {success && <p className={styles.successMsg} role="status">{success}</p>}

      <section className={styles.section}>
        <h3>Marca y estados</h3>
        <p className={styles.sectionHint}>Un solo valor por color — se usa igual en modo claro y oscuro.</p>
        <div className={styles.grid}>
          {INVARIANT_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              value={draft.invariant[f.key] ?? f.defaultLight}
              onChange={(v) => setField('invariant', f.key, v)}
            />
          ))}
        </div>
      </section>

      <div className={styles.modesRow}>
        <section className={styles.section}>
          <h3>Modo claro</h3>
          <div className={styles.grid}>
            {REACTIVE_FIELDS.map((f) => (
              <ColorField
                key={f.key}
                label={f.label}
                value={draft.light[f.key] ?? f.defaultLight}
                onChange={(v) => setField('light', f.key, v)}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3>Modo oscuro</h3>
          <div className={styles.grid}>
            {REACTIVE_FIELDS.map((f) => (
              <ColorField
                key={f.key}
                label={f.label}
                value={draft.dark[f.key] ?? f.defaultDark ?? f.defaultLight}
                onChange={(v) => setField('dark', f.key, v)}
              />
            ))}
          </div>
        </section>
      </div>

      <Modal isOpen={confirmResetOpen} onClose={() => setConfirmResetOpen(false)} title="Restablecer tema">
        <p className={styles.confirmText}>
          ¿Restablecer todos los colores a los valores por defecto del sistema de diseño? Esta
          acción afecta a todos los usuarios de inmediato.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setConfirmResetOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleReset} isLoading={isSaving}>Restablecer</Button>
        </div>
      </Modal>
    </div>
  );
};
