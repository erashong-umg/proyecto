// Debe coincidir exactamente con INVARIANT_THEME_KEYS / REACTIVE_THEME_KEYS en
// backend-express/src/models/ThemeSettings.ts. No hay paquete compartido entre
// los dos proyectos (son dos npm independientes, ver CLAUDE.md), así que esta
// lista se mantiene en sincronía a mano.

export type InvariantThemeKey =
  | 'color-primary'
  | 'color-primary-dark'
  | 'color-primary-light'
  | 'color-danger'
  | 'color-danger-dark'
  | 'color-warning'
  | 'color-warning-dark'
  | 'color-success'
  | 'color-success-dark'
  | 'color-info'
  | 'on-accent-text';

export type ReactiveThemeKey =
  | 'color-bg'
  | 'color-surface'
  | 'color-surface-alt'
  | 'color-text'
  | 'color-text-muted'
  | 'color-text-light'
  | 'color-border'
  | 'color-border-strong';

export type InvariantThemeMap = Partial<Record<InvariantThemeKey, string>>;
export type ReactiveThemeMap = Partial<Record<ReactiveThemeKey, string>>;

export interface ThemeSettings {
  invariant: InvariantThemeMap;
  light: ReactiveThemeMap;
  dark: ReactiveThemeMap;
}

export const EMPTY_THEME_SETTINGS: ThemeSettings = { invariant: {}, light: {}, dark: {} };

interface ThemeFieldMeta<K extends string> {
  key: K;
  label: string;
  /** Valor por defecto del sistema de diseño (frontend-react/src/styles/_theme.scss), para mostrar y para "Restablecer". */
  defaultLight: string;
  defaultDark?: string;
}

// Grupo 1: colores de marca y estado — un único valor, igual en claro/oscuro.
export const INVARIANT_FIELDS: ThemeFieldMeta<InvariantThemeKey>[] = [
  { key: 'color-primary', label: 'Primario', defaultLight: '#b73e17' },
  { key: 'color-primary-dark', label: 'Primario (oscuro)', defaultLight: '#9b361c' },
  { key: 'color-primary-light', label: 'Primario (claro)', defaultLight: '#dc541a' },
  { key: 'color-success', label: 'Éxito', defaultLight: '#b73e17' },
  { key: 'color-success-dark', label: 'Éxito (oscuro)', defaultLight: '#9b361c' },
  { key: 'color-danger', label: 'Peligro', defaultLight: '#b84141' },
  { key: 'color-danger-dark', label: 'Peligro (oscuro)', defaultLight: '#8a2f2f' },
  { key: 'color-warning', label: 'Advertencia', defaultLight: '#b8860b' },
  { key: 'color-warning-dark', label: 'Advertencia (oscuro)', defaultLight: '#8a6308' },
  { key: 'color-info', label: 'Información', defaultLight: '#2e7d8c' },
  { key: 'on-accent-text', label: 'Texto sobre acento', defaultLight: '#ffffff' },
];

// Grupo 2: fondo, superficies, texto y bordes — un valor para claro y otro para oscuro.
export const REACTIVE_FIELDS: ThemeFieldMeta<ReactiveThemeKey>[] = [
  { key: 'color-bg', label: 'Fondo', defaultLight: '#fafafa', defaultDark: '#0a0a0a' },
  { key: 'color-surface', label: 'Superficie', defaultLight: '#ffffff', defaultDark: '#171717' },
  { key: 'color-surface-alt', label: 'Superficie alterna', defaultLight: '#f2f2f2', defaultDark: '#2b2b2b' },
  { key: 'color-text', label: 'Texto', defaultLight: '#424242', defaultDark: '#fafafa' },
  { key: 'color-text-muted', label: 'Texto atenuado', defaultLight: '#5c5c5c', defaultDark: '#cccccc' },
  { key: 'color-text-light', label: 'Texto tenue', defaultLight: '#787878', defaultDark: '#a3a3a3' },
  { key: 'color-border', label: 'Borde', defaultLight: '#e3e3e3', defaultDark: '#424242' },
  { key: 'color-border-strong', label: 'Borde marcado', defaultLight: '#cccccc', defaultDark: '#5c5c5c' },
];
