// Google Identity Services (inicio de sesión con Google). El botón oficial
// entrega un ID token (JWT) que el backend verifica contra Google; el Client ID
// es público (no es un secreto) y debe coincidir con GOOGLE_CLIENT_ID del backend.

export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

// Sin Client ID configurado, el inicio de sesión con Google no se ofrece.
export const isGoogleEnabled = GOOGLE_CLIENT_ID !== '';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill';
  width?: number;
  locale?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

// Carga el script de Google una sola vez para toda la app.
export const loadGoogleScript = (): Promise<void> => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;     // permite reintentar si fue un corte de red
        reject(new Error('No se pudo cargar Google.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};
