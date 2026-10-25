import { Router } from 'express';
import { env } from '../config/env';

const router = Router();

// Qué versión del backend está corriendo. Los valores se fijan al construir la
// imagen (ver deploy.yml y el Dockerfile); en desarrollo valen "dev" / "local".
const buildInfo = () => ({
  version: env.APP_VERSION,          // git describe: "v1.2" o "v1.2-5-gabc1234"
  branch: env.APP_BRANCH,            // rama desplegada
  commit: env.APP_COMMIT,            // SHA corto del commit construido
  builtAt: env.APP_BUILT_AT || null, // fecha de compilación (UTC)
});

// Health check (lo usan el HEALTHCHECK de Docker, el smoke test y el deploy).
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'educaspot-backend',
    ...buildInfo(),
  });
});

// Versión publicada: pública y sin datos sensibles.
router.get('/version', (_req, res) => {
  res.json({
    service: 'educaspot-backend',
    environment: env.NODE_ENV,
    ...buildInfo(),
  });
});

export default router;
