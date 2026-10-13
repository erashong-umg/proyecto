import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useCustomThemeStore } from '../store/customThemeStore';
import { EMPTY_THEME_SETTINGS, type ThemeSettings } from '../types/theme';

// Edición del tema global desde /admin/apariencia. Reutiliza
// customThemeStore para que, al guardar, el cambio se vea de inmediato en
// toda la app (misma pestaña) sin esperar a un refresh — useApplyCustomTheme
// está suscrito al mismo store.
export const useAdminTheme = () => {
  const storeSettings = useCustomThemeStore((state) => state.settings);
  const setStoreSettings = useCustomThemeStore((state) => state.setSettings);
  const [draft, setDraft] = useState<ThemeSettings>(EMPTY_THEME_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ theme: ThemeSettings }>('/theme')
      .then((res) => {
        setDraft(res.data.theme);
        setStoreSettings(res.data.theme);
      })
      .catch((err) => setError(getErrorMessage(err, 'No se pudo cargar el tema actual.')))
      .finally(() => setIsLoading(false));
  }, [setStoreSettings]);

  useEffect(() => { load(); }, [load]);

  const setField = (
    group: keyof ThemeSettings,
    key: string,
    value: string
  ): void => {
    setDraft((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  };

  const save = async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.patch<{ theme: ThemeSettings }>('/theme', draft);
      setDraft(res.data.theme);
      setStoreSettings(res.data.theme);
      setSuccess('Tema guardado. Los cambios ya se aplicaron para todos los usuarios.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el tema.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const reset = async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<{ theme: ThemeSettings }>('/theme/reset');
      setDraft(res.data.theme);
      setStoreSettings(res.data.theme);
      setSuccess('Tema restablecido a los valores por defecto.');
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer el tema.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { draft, storeSettings, isLoading, isSaving, error, success, setField, save, reset };
};
