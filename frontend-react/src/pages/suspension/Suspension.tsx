import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppeal } from '../../hooks/useAppeal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { formatLongDate } from '../../services/formatters';
import styles from './Suspension.module.scss';

export const SuspensionPage = () => {
  const { user, logout } = useAuth();
  const { message, setMessage, error, success, isLoading, handleSubmit } = useAppeal();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}><AlertTriangle aria-hidden="true" /></div>
        <h1>Su cuenta está suspendida</h1>
        <p className={styles.reason}>
          <strong>Motivo:</strong> {user?.suspensionReason || 'No especificado'}
        </p>
        <p className={styles.date}>
          <strong>Fecha del bloqueo:</strong>{' '}
          {user?.suspensionDate ? formatLongDate(user.suspensionDate) : 'No disponible'}
        </p>

        <p className={styles.info}>
          Mientras su cuenta esté suspendida, no podrá acceder a las demás funciones de la plataforma.
          Si considera que el bloqueo fue un error, puede presentar una apelación formal.
        </p>

        {success ? (
          <div className={styles.successMsg}>
            <CheckCircle2 className={styles.successIcon} aria-hidden="true" />
            Su apelación fue recibida. La administración la revisará en un plazo de 5 días hábiles.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Apelar la suspensión</h2>
            <Textarea
              label="Explique su caso"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              placeholder="Describa las circunstancias que considere relevantes."
            />
            {error && <div className={styles.errorMsg}>{error}</div>}
            <Button type="submit" isLoading={isLoading} disabled={!message.trim()}>
              Enviar apelación
            </Button>
          </form>
        )}

        <div className={styles.footer}>
          <Link to="/politicas">Leer políticas de convivencia</Link>
          <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
        </div>
      </div>
    </div>
  );
};
