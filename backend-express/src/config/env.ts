import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es requerido'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('dev'),
  // Client ID de OAuth 2.0 de Google (Google Cloud Console → Credenciales). Es
  // público, no un secreto. Vacío = el inicio de sesión con Google queda
  // deshabilitado (el endpoint responde 503).
  GOOGLE_CLIENT_ID: z.string().default(''),
  // Zona horaria en la que los tutores definen sus horarios (el servidor puede
  // correr en UTC). Ver src/utils/time.ts.
  APP_TIMEZONE: z.string().default('America/Guatemala'),
  // Metadatos de la compilación (los fija el workflow de despliegue al construir
  // la imagen). Sin ellos: ejecución local.
  APP_VERSION: z.string().default('dev'),
  APP_BRANCH: z.string().default('local'),
  APP_COMMIT: z.string().default('local'),
  APP_BUILT_AT: z.string().default(''),
  // Servidor OSRM para rutas por calles. Vacío = sin routing (línea recta).
  // El demo público es solo para desarrollo; en producción conviene uno propio.
  OSRM_URL: z.string().default('https://router.project-osrm.org'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Error en variables de entorno:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
