import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAdminLoginForm } from '../../hooks/useAdminLoginForm';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './AdminLogin.module.scss';

export const AdminLoginPage = () => {
  const { email, setEmail, password, setPassword, error, isLoading, handleSubmit } = useAdminLoginForm();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  if (authLoading) return <p className={styles.status}>Cargando…</p>;

  // Ya hay sesión: un admin no necesita volver a loguearse, y un
  // estudiante/tutor no debe ver este formulario — a cada uno lo mandamos a
  // su propio espacio.
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}><ShieldCheck aria-hidden="true" /></div>
        <h1 className={styles.title}>Panel de administración</h1>
        <p className={styles.subtitle}>Acceso restringido al personal autorizado de EducaSpot.</p>

        {error && <div className={styles.errorMsg} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
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
          <Button type="submit" isLoading={isLoading} size="lg" className={styles.submit}>
            Ingresar al panel
          </Button>
        </form>

        <Link to="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" /> Volver al sitio
        </Link>
      </div>
    </div>
  );
};
