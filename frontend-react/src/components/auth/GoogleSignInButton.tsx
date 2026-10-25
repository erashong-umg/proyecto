import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, isGoogleEnabled, loadGoogleScript } from '../../services/google';
import styles from './GoogleSignInButton.module.scss';

interface GoogleSignInButtonProps {
  /** Recibe el ID token que entrega Google; el padre lo manda al backend. */
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

// Botón oficial de Google Identity Services. No se dibuja si no hay Client ID
// configurado (VITE_GOOGLE_CLIENT_ID).
export const GoogleSignInButton = ({ onCredential, text = 'continue_with' }: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!isGoogleEnabled || !container) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callbackRef.current(response.credential),
          auto_select: false,
        });
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          // El botón de Google no es fluido: se le da el ancho del contenedor (200–400px).
          width: Math.min(400, Math.max(200, Math.round(container.getBoundingClientRect().width))),
          locale: 'es',
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [text]);

  if (!isGoogleEnabled) return null;
  if (failed) return <p className={styles.error}>No se pudo cargar el acceso con Google. Revise su conexión.</p>;
  return <div ref={containerRef} className={styles.container} />;
};
