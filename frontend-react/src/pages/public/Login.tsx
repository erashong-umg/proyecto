import { Link } from 'react-router-dom';
import { useLoginForm } from '../../hooks/useLoginForm';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import styles from './Auth.module.scss';

export const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, isLoading, expired, handleSubmit, handleGoogleStub } = useLoginForm();

  return (
    <div className={styles.auth}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Ingrese a su cuenta de EducaSpot.</p>

          {expired && <div className={styles.expiredMsg}>Su sesión expiró. Inicie sesión de nuevo.</div>}
          {error && <div className={styles.errorMsg}>{error}</div>}

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

          <div className={styles.divider}>o</div>

          <Button type="button" variant="secondary" size="lg" onClick={handleGoogleStub}>
            Continuar con Google (stub)
          </Button>

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
