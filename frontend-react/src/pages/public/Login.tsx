import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useLoginForm } from '../../hooks/useLoginForm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { isGoogleEnabled } from '../../services/google';
import { AuthBrandLink } from '../../components/auth/AuthBrandLink';
import styles from './Auth.module.scss';

export const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, isLoading, expired, handleSubmit, handleGoogleCredential } = useLoginForm();
  // Acceso rápido: con Google habilitado, es la entrada principal y el correo y la
  // contraseña quedan plegados hasta que se pidan. Sin Google, el formulario va abierto.
  const [showEmail, setShowEmail] = useState(!isGoogleEnabled);

  return (
    <div className={styles.auth}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <AuthBrandLink />
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Ingrese a su cuenta de EducaSpot.</p>

          {expired && <div className={styles.expiredMsg}>Su sesión expiró. Inicie sesión de nuevo.</div>}
          {error && <div className={styles.errorMsg}>{error}</div>}

          {isGoogleEnabled && (
            <>
              <GoogleSignInButton text="signin_with" onCredential={handleGoogleCredential} />
              <div className={styles.divider}>o</div>
              <button
                type="button"
                className={styles.emailToggle}
                aria-expanded={showEmail}
                aria-controls="login-email-form"
                onClick={() => setShowEmail((v) => !v)}
              >
                Usar correo y contraseña
                <ChevronDown aria-hidden="true" className={showEmail ? styles.chevronOpen : undefined} />
              </button>
            </>
          )}

          {showEmail && (
            <div id="login-email-form" className={styles.emailForm}>
              <Input
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Link to="/recuperar" className={styles.forgotLink}>¿Olvidó su contraseña?</Link>

              <Button type="submit" isLoading={isLoading} size="lg" className={styles.submit}>
                Iniciar sesión
              </Button>
            </div>
          )}

          <p className={styles.footer}>
            ¿No tiene cuenta? <Link to="/register">Crear cuenta</Link>
          </p>
          <p className={styles.footer}>
            ¿Es administrador? <Link to="/admin/login">Ingrese aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
