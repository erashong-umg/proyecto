import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useRegisterForm } from '../../hooks/useRegisterForm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RoleSelector } from '../../components/auth/RoleSelector';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { isGoogleEnabled } from '../../services/google';
import { AuthBrandLink } from '../../components/auth/AuthBrandLink';
import styles from './Auth.module.scss';

export const RegisterPage = () => {
  const { form, setRole, handleChange, error, isLoading, handleSubmit, handleGoogleCredential } = useRegisterForm();
  // Registro rápido: se elige el rol y se entra con Google; el formulario de correo
  // (nombre, correo y dos contraseñas) queda plegado salvo que Google no esté habilitado.
  const [showEmail, setShowEmail] = useState(!isGoogleEnabled);

  return (
    <div className={styles.auth}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <AuthBrandLink />
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Únase a EducaSpot como estudiante o tutor.</p>

          {error && <div className={styles.errorMsg}>{error}</div>}

          <RoleSelector value={form.role} onChange={setRole} />

          {isGoogleEnabled && (
            <>
              <GoogleSignInButton text="signup_with" onCredential={handleGoogleCredential} />
              <p className={styles.googleHint}>
                Con Google se creará su cuenta como <strong>{form.role === 'tutor' ? 'tutor' : 'estudiante'}</strong>.
              </p>
              <div className={styles.divider}>o</div>
              <button
                type="button"
                className={styles.emailToggle}
                aria-expanded={showEmail}
                aria-controls="register-email-form"
                onClick={() => setShowEmail((v) => !v)}
              >
                Registrarme con correo y contraseña
                <ChevronDown aria-hidden="true" className={showEmail ? styles.chevronOpen : undefined} />
              </button>
            </>
          )}

          {showEmail && (
            <div id="register-email-form" className={styles.emailForm}>
              <Input label="Nombre completo" value={form.name} onChange={handleChange('name')} required />
              <Input label="Correo electrónico" type="email" value={form.email} onChange={handleChange('email')} required autoComplete="email" />
              <Input label="Contraseña" type="password" value={form.password} onChange={handleChange('password')} required hint="Mínimo 8 caracteres, una mayúscula y un número" autoComplete="new-password" />
              <Input label="Confirmar contraseña" type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} required autoComplete="new-password" />

              <Button type="submit" isLoading={isLoading} size="lg" className={styles.submit}>
                Crear cuenta
              </Button>
            </div>
          )}

          <p className={styles.footer}>
            ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
