import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { getErrorMessage } from '../services/api';

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'tutor';
}

interface UseRegisterFormResult {
  form: RegisterFormState;
  setRole: (role: 'student' | 'tutor') => void;
  handleChange: (field: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  isLoading: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

export const useRegisterForm = (): UseRegisterFormResult => {
  const [form, setForm] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const setRole = (role: 'student' | 'tutor') => setForm((f) => ({ ...f, role }));

  const handleChange = (field: keyof RegisterFormState) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
      });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la cuenta.'));
    } finally {
      setIsLoading(false);
    }
  };

  return { form, setRole, handleChange, error, isLoading, handleSubmit };
};
