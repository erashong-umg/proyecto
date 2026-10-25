import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
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
  /** Credencial de Google de alguien que aún no tiene cuenta: falta que elija su rol. */
  pendingGoogle: string | null;
  completeGoogleSignup: (role: 'student' | 'tutor') => Promise<void>;
  cancelGoogleSignup: () => void;
}

export const useLoginForm = (): UseLoginFormResult => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingGoogle, setPendingGoogle] = useState<string | null>(null);
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

  const finishGoogle = async (credential: string, role?: 'student' | 'tutor') => {
    await loginWithGoogle(credential, role);
    setPendingGoogle(null);
    // Una cuenta nueva (o sin perfil completo) pasa primero por el onboarding.
    const completed = useAuthStore.getState().user?.onboardingCompleted;
    navigate(completed ? from : '/onboarding', { replace: true });
  };

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await finishGoogle(credential);
    } catch (err) {
      // Primera vez con esta cuenta de Google: no es un error, solo falta el rol.
      // Se conserva la misma credencial para crearla sin pedirle a Google otra vez.
      if (isAxiosError(err) && err.response?.data?.details?.code === 'GOOGLE_ACCOUNT_NOT_FOUND') {
        setPendingGoogle(credential);
      } else {
        setError(getErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleSignup = async (role: 'student' | 'tutor') => {
    if (!pendingGoogle) return;
    setError(null);
    setIsLoading(true);
    try {
      await finishGoogle(pendingGoogle, role);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la cuenta con Google.'));
      setPendingGoogle(null);   // la credencial puede haber vencido: que vuelva a pulsar el botón
    } finally {
      setIsLoading(false);
    }
  };

  const cancelGoogleSignup = () => {
    setPendingGoogle(null);
    setError(null);
  };

  return { email, setEmail, password, setPassword, error, isLoading, expired, handleSubmit, handleGoogleCredential, pendingGoogle, completeGoogleSignup, cancelGoogleSignup };
};
