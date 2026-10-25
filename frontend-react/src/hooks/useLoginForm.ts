import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store/authStore';
import api, { TOKEN_KEY, getErrorMessage } from '../services/api';

interface UseLoginFormResult {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  isLoading: boolean;
  expired: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleGoogleCredential: (credential: string) => Promise<void>;
}

export const useLoginForm = (): UseLoginFormResult => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const expired = new URLSearchParams(location.search).get('expired') === '1';
  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // El panel de administración vive aparte, en /admin/login — una cuenta
      // de admin no debe terminar mezclada con el shell público de
      // estudiante/tutor. El rol se valida ANTES de tocar localStorage/el
      // store global: si se confirmara la sesión primero y recién después se
      // detectara el rol, el guard de "ya autenticado" en PublicShell
      // alcanza a redirigir en el re-render intermedio antes de que el
      // logout de reversión corra (carrera real, confirmada a mano en el
      // flujo gemelo de /admin/login).
      const { data } = await api.post<{ user: { role: string }; token: string }>('/auth/login', { email, password });
      if (data.user.role === 'admin') {
        setError('Los administradores deben ingresar desde el panel de administración.');
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      await useAuthStore.getState().refreshUser();
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      // Una cuenta nueva (o sin perfil completo) pasa primero por el onboarding.
      const completed = useAuthStore.getState().user?.onboardingCompleted;
      navigate(completed ? from : '/onboarding', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, isLoading, expired, handleSubmit, handleGoogleCredential };
};
