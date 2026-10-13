import { useState, type FormEvent } from 'react';
import api, { getErrorMessage } from '../services/api';

interface UseAppealResult {
  message: string;
  setMessage: (value: string) => void;
  error: string | null;
  success: boolean;
  isLoading: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/** Formulario de apelación de cuenta suspendida (POST /api/appeals). */
export const useAppeal = (): UseAppealResult => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    try {
      await api.post('/appeals', { message });
      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar la apelación.'));
    } finally {
      setIsLoading(false);
    }
  };

  return { message, setMessage, error, success, isLoading, handleSubmit };
};
