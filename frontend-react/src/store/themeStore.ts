import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | null; // null = sigue al sistema

const STORAGE_KEY = 'edumarket_theme';

const applyTheme = (theme: ThemePreference) => {
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
};

const getStored = (): ThemePreference => {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : null;
};

interface ThemeStore {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  toggle: () => void;
}

const initialTheme = getStored();
// index.html ya aplicó esto mismo de forma síncrona antes del primer paint
// (evita el flash); esto solo mantiene el estado de React en sincronía.
applyTheme(initialTheme);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    if (theme) localStorage.setItem(STORAGE_KEY, theme);
    else localStorage.removeItem(STORAGE_KEY);
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    const current = get().theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveIsDark = current ? current === 'dark' : systemPrefersDark;
    get().setTheme(effectiveIsDark ? 'light' : 'dark');
  },
}));
