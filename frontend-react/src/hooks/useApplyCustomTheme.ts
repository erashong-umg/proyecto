import { useEffect, useState } from 'react';
import api from '../services/api';
import { useThemeStore } from '../store/themeStore';
import { useCustomThemeStore } from '../store/customThemeStore';
import { INVARIANT_FIELDS, REACTIVE_FIELDS, type ThemeSettings } from '../types/theme';

const ALL_KEYS = [...INVARIANT_FIELDS, ...REACTIVE_FIELDS].map((f) => f.key);

// Para CADA token conocido (no solo los presentes en `map`) hay que decidir
// set vs. remove — si un admin guarda un override y luego lo borra, o si un
// token solo tiene valor personalizado en modo claro, el inline style previo
// debe limpiarse explícitamente; de lo contrario gana por especificidad sobre
// la regla del modo activo y el valor "viejo" queda pegado para siempre.
const applyVars = (map: Record<string, string | undefined>): void => {
  const root = document.documentElement.style;
  ALL_KEYS.forEach((key) => {
    const value = map[key];
    if (value) root.setProperty(`--${key}`, value);
    else root.removeProperty(`--${key}`);
  });
};

/**
 * Aplica el tema personalizado (guardado por el admin en /admin/apariencia) a
 * todos los usuarios — los 3 roles y también las páginas públicas sin sesión
 * (login/registro). Se monta UNA sola vez en AppRouter, igual que
 * useSocketConnection.
 *
 * Los overrides se escriben como inline style en <html>, que gana por
 * especificidad sobre cualquier regla de _theme.scss — por eso los tokens
 * "reactivos" (fondo/texto/bordes) solo se aplican para el modo claro u
 * oscuro que esté activo en ESE momento; si se aplicaran ambos a la vez, el
 * toggle de claro/oscuro dejaría de funcionar.
 */
export const useApplyCustomTheme = (): void => {
  const preference = useThemeStore((state) => state.theme);
  const setSettings = useCustomThemeStore((state) => state.setSettings);
  const settings = useCustomThemeStore((state) => state.settings);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setSystemPrefersDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    api
      .get<{ theme: ThemeSettings }>('/theme')
      .then((res) => setSettings(res.data.theme))
      .catch(() => {
        // Sin conexión o sin configuración todavía: se queda con los valores
        // por defecto de _theme.scss, no es un error visible para el usuario.
      });
  }, [setSettings]);

  useEffect(() => {
    const isDark = preference ? preference === 'dark' : systemPrefersDark;
    // Un solo merge + una sola pasada sobre ALL_KEYS: aplicar invariant y
    // reactive en llamadas separadas pisaría cada una las claves que la otra
    // no conoce (cada pasada decide set/remove para TODAS las claves).
    applyVars({ ...settings.invariant, ...(isDark ? settings.dark : settings.light) });
  }, [settings, preference, systemPrefersDark]);
};
