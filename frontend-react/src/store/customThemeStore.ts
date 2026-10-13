import { create } from 'zustand';
import type { ThemeSettings } from '../types/theme';
import { EMPTY_THEME_SETTINGS } from '../types/theme';

interface CustomThemeStore {
  settings: ThemeSettings;
  isLoaded: boolean;
  setSettings: (settings: ThemeSettings) => void;
}

// Estado global del tema personalizado por el admin (distinto del claro/oscuro
// de themeStore.ts). Se llena una sola vez al montar la app vía
// useApplyCustomTheme y lo vuelve a llenar useAdminTheme después de guardar.
export const useCustomThemeStore = create<CustomThemeStore>((set) => ({
  settings: EMPTY_THEME_SETTINGS,
  isLoaded: false,
  setSettings: (settings) => set({ settings, isLoaded: true }),
}));
