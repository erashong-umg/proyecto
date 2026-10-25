import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Versión visible en el badge flotante. En el build de Docker llegan por
// VITE_APP_* (los pasa el workflow de despliegue); en local, sin esas
// variables, se leen del repositorio git.
const git = (args: string): string => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';   // sin git (p. ej. dentro de la imagen): se usa el valor por defecto
  }
};

// "v1.2" si el commit está etiquetado; si no, el último tag por número de versión
// + el commit ("v1.2+abc1234"). `git describe` no sirve aquí: solo ve tags que son
// ancestros del commit y develop no contiene los de main.
const commit = git('rev-parse --short HEAD');
const latestTag = git('tag --sort=-v:refname').split('\n')[0];
const localVersion = git('describe --tags --exact-match') || (latestTag ? `${latestTag}+${commit}` : commit);

const build = {
  VITE_APP_VERSION: process.env.VITE_APP_VERSION || localVersion || 'dev',
  VITE_APP_BRANCH: process.env.VITE_APP_BRANCH || git('rev-parse --abbrev-ref HEAD') || 'local',
  VITE_APP_COMMIT: process.env.VITE_APP_COMMIT || commit || 'local',
  VITE_APP_BUILT_AT: process.env.VITE_APP_BUILT_AT || new Date().toISOString(),
};

export default defineConfig({
  plugins: [react()],
  define: Object.fromEntries(
    Object.entries(build).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
  ),
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
