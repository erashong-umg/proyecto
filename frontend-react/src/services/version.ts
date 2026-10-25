// Datos de la compilación del frontend. Los define vite.config.ts: en el build
// de Docker vienen de VITE_APP_* (workflow de despliegue) y en local del git.

export interface BuildInfo {
  version: string;           // git describe: "v1.2" o "v1.2-5-gabc1234"
  branch: string;            // rama compilada
  commit: string;            // SHA corto
  builtAt: string | null;    // ISO UTC
}

export const FRONTEND_BUILD: BuildInfo = {
  version: import.meta.env.VITE_APP_VERSION ?? 'dev',
  branch: import.meta.env.VITE_APP_BRANCH ?? 'local',
  commit: import.meta.env.VITE_APP_COMMIT ?? 'local',
  builtAt: import.meta.env.VITE_APP_BUILT_AT || null,
};

// Versión que informa el backend (GET /api/version).
export interface BackendVersion extends BuildInfo {
  environment: string;
}

// Los commits "local" no se pueden comparar (desarrollo sin build de despliegue).
export const isComparable = (commit: string): boolean => commit !== 'local' && commit !== '';
