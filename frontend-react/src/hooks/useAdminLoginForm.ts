import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TOKEN_KEY, getErrorMessage } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface UseAdminLoginFormResult {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  isLoading: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * Login exclusivo de /admin/login. Pega contra el mismo POST /api/auth/login
 * que el resto de la app (un solo backend, ver CLAUDE.md), pero valida el rol
 * ANTES de tocar localStorage/el store global de auth — si se confirmara la
 * sesión primero y recién después se detectara que no es admin, el guard de
 * "ya autenticado" en PublicShell/AdminLoginPage alcanza a redirigir en el
 * re-render intermedio antes de que el logout de reversión corra (carrera
 * real, confirmada a mano: un estudiante terminaba en "/" en vez de ver el
 * mensaje de error). Validando primero, un usuario no-admin nunca llega a
 * estar "autenticado" globalmente, ni sea por un instante.
 */
export const useAdminLoginForm = (): UseAdminLoginFormResult => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.post<{ user: { role: string }; token: string }>('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        setError('Esta sección es solo para administradores.');
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      await useAuthStore.getState().refreshUser();
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'));
    } finally {
      setIsLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, isLoading, handleSubmit };
};
