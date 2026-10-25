# EducaSpot — Marketplace Educativo

EducaSpot es un marketplace de tutorías académicas (Guatemala) que conecta estudiantes y tutores: búsqueda geoespacial de tutores, agendamiento con prevención de traslapes, chat en tiempo real, reseñas y un panel de moderación/administración. Proyecto académico individual (Universidad Mariano Gálvez), construido con Express 5 + TypeScript + MongoDB en el backend y React 19 + TypeScript en el frontend.

## Arranque rápido

1. Clonar el repositorio.
2. Levantar MongoDB local vía Docker Compose:
   ```bash
   docker compose -f MongoDB/mongodb-compose.yml up -d
   ```
3. Instalar dependencias del backend y configurar variables de entorno:
   ```bash
   cd backend-express
   npm install
   cp .env.example .env
   ```
4. Instalar dependencias del frontend:
   ```bash
   cd frontend-react
   npm install
   ```
5. Sembrar datos de demo y levantar ambos servidores en paralelo (dos terminales):
   ```bash
   # Terminal 1 (backend-express/)
   npm run seed
   npm run dev

   # Terminal 2 (frontend-react/)
   npm run dev
   ```

El backend queda disponible en `http://localhost:4000` y el frontend (Vite) en `http://localhost:5173` (configurable vía `CORS_ORIGIN` en el `.env` del backend).

## Estructura del repo

```
proyecto/
├── backend-express/      API REST + WebSocket (Express 5, TypeScript, Mongoose, Socket.io)
├── frontend-react/        SPA (React 19, TypeScript, SASS modules, Zustand, Leaflet)
├── MongoDB/                docker-compose para levantar MongoDB localmente
└── docs/                   manual técnico y manual de usuario
```

## Stack técnico

- **Backend**: Express 5, TypeScript, Mongoose (MongoDB), Socket.io (chat en tiempo real), autenticación JWT vía header `Authorization: Bearer <token>`, validación con Zod, logging con Winston, tests con Vitest + Supertest.
- **Frontend**: React 19, TypeScript, SASS modules, Zustand (estado global), React Router, Leaflet / React-Leaflet (mapas), Axios, Socket.io-client.
- **Base de datos**: MongoDB 8 (contenedor Docker local).

## Tests

Desde `backend-express/`:

```bash
npm test               # ejecuta la suite una vez (vitest + supertest)
npm run test:watch     # modo watch
```

Los tests de integración requieren que el contenedor de MongoDB esté corriendo y usan una base de datos separada (`MONGODB_URI_TEST`, apuntando a `educaspot-test`).

## Despliegue

La aplicación se publica en un servidor propio con **GitHub Actions + Podman + nginx**: cada integración en `main` construye las imágenes del backend y del frontend y las despliega por SSH. También se puede desplegar a mano cualquier rama (`main`, `release` o `develop`) desde *Actions → Deploy → Run workflow*. La versión que corre se ve en el badge de la esquina inferior izquierda y en `/api/version`.

Guía completa en [docs/despliegue.md](docs/despliegue.md); cómo llega un cambio a producción, en [docs/flujo-de-ramas.md](docs/flujo-de-ramas.md). Para desarrollo local: `npm run dev` en ambos proyectos (ver *Arranque rápido*). `backend-express/render.yaml` se conserva como evidencia de portabilidad a otro proveedor.

## Documentación

- [Flujo de ramas y publicación](docs/flujo-de-ramas.md) — `develop` → `release` → `main`
- [Despliegue](docs/despliegue.md)
- [Manual técnico](docs/manual-tecnico.md)
- [Manual de usuario](docs/manual-usuario.md)

## Credenciales de demo

Generadas por `backend-express/src/seed/seed.ts` (`npm run seed`):

| Rol | Email | Contraseña | Notas |
|---|---|---|---|
| Admin | `admin@educaspot.gt` | `Admin123!` | Panel de administración completo |
| Tutor | `maria@educaspot.gt` | `Tutor123!` | Aprobado — inglés y desarrollo web |
| Tutor | `juan@educaspot.gt` | `Tutor123!` | Aprobado — natación |
| Tutor | `carlos@educaspot.gt` | `Tutor123!` | Pendiente de aprobación (para probar el flujo de moderación) |
| Tutores | `laura`, `diego`, `patricia`, `ricardo`, `daniela`, `andres`, `sofia` `@educaspot.gt` | `Tutor123!` | Aprobados, un curso cada uno (10 tutores y 10 cursos en total) |
| Estudiante | `ana@educaspot.gt` | `Est123!` | Tiene una tutoría completada + reseña de prueba |
| Estudiante | `luis@educaspot.gt` | `Est123!` | — |

## Notas para el revisor

- Este proyecto documenta explícitamente un conjunto de simplificaciones aceptadas por restricciones de tiempo/alcance del curso, entre ellas: el CV y la foto de perfil se guardan como URL en vez de subida de archivo; el calendario solo tiene vista semanal (sin vista diaria/mensual); la suscripción periódica crea N reservas individuales en vez de un motor de recurrencia; y la búsqueda geoespacial filtra por radio en memoria (Haversine) en vez de un índice `2dsphere` de MongoDB. Todas estas son decisiones aceptadas y documentadas, no pendientes ni bugs.
- Credenciales de demo: ver la tabla de la sección anterior.
