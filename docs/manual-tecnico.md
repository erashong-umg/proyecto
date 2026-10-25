# Manual técnico — EducaSpot (EduMarket)

> Proyecto académico de la Universidad Mariano Gálvez. Entrega: 2026-10-18.
> Este manual documenta el estado real del código en el momento de su redacción
> (backend F1+F2 cerrados, frontend en F3/F4), no un diseño aspiracional.

## Índice

1. [Descripción general del proyecto](#1-descripción-general-del-proyecto)
2. [Arquitectura](#2-arquitectura)
3. [Componentes principales del backend](#3-componentes-principales-del-backend)
4. [Componentes principales del frontend](#4-componentes-principales-del-frontend)
5. [TypeScript: path aliases y convenciones de tipos](#5-typescript-path-aliases-y-convenciones-de-tipos)
6. [SASS: sistema de diseño y modo light/dark](#6-sass-sistema-de-diseño-y-modo-lightdark)
7. [Diagrama entidad-relación](#7-diagrama-entidad-relación)
8. [Decisiones técnicas clave](#8-decisiones-técnicas-clave)
9. [Seguridad](#9-seguridad)
10. [Limitaciones conocidas / stubs (D1-D10)](#10-limitaciones-conocidas--stubs-d1-d10)
11. [Sistema de diseño: tabla de tokens](#11-sistema-de-diseño-tabla-de-tokens)

---

## 1. Descripción general del proyecto

**EducaSpot** (nombre interno de trabajo: "EduMarket") es un marketplace de
tutorías académicas para Guatemala. Conecta a tres tipos de usuario:

- **Estudiantes**: buscan tutores por categoría académica (matemática, física,
  idiomas, etc.), filtran por cercanía geográfica y tarifa, reservan sesiones
  (virtuales o presenciales) y califican al tutor al finalizar.
- **Tutores**: publican su perfil (biografía, tarifa base por hora, tarifa por
  km de traslado, categorías que dominan, CV/portafolio), configuran su
  disponibilidad semanal en una cuadrícula de horas, aceptan/gestionan
  reservas y conversan con sus estudiantes por chat en tiempo real.
- **Administradores**: aprueban o rechazan solicitudes de tutor, gestionan
  categorías, resuelven reportes de convivencia y apelaciones de suspensión,
  y consultan analítica de la plataforma (tutores mejor calificados, demanda
  por categoría, actividad mensual de reservas).

El problema de negocio que resuelve: en el mercado informal de tutorías
guatemalteco no hay un lugar centralizado donde comparar tutores por
distancia real, precio y calificación verificada por reseñas de clases
efectivamente completadas. La plataforma formaliza ese emparejamiento con
un flujo de reserva con anti-traslape de horarios, cálculo de precio por
distancia (Haversine) y moderación de conducta vía reportes/apelaciones.

El código, los comentarios, los mensajes de error de la API y los commits
están en español; la interfaz usa "usted" (nunca tuteo) y formato `es-GT`
para fechas y moneda (quetzales, `Q`).

## 2. Arquitectura

Arquitectura de tres capas, cliente-servidor clásica, sin microservicios ni
colas de mensajes — apropiada para el volumen de datos de un proyecto
académico:

```
┌─────────────────────────────────────────────────────────────────┐
│                     NAVEGADOR (cliente)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  frontend-react/  (Vite + React 19 + TypeScript)         │   │
│  │  - React Router 7 (rutas protegidas por rol)             │   │
│  │  - Zustand (authStore, themeStore, socketStore)          │   │
│  │  - Axios (api.ts) ──── Authorization: Bearer <JWT>       │   │
│  │  - socket.io-client ──── auth.token en el handshake      │   │
│  │  - React-Leaflet (mapas) · SASS Modules (UI)             │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬───────────────────┬─────────────────┘
                 HTTPS REST  │                   │ WebSocket (Socket.io)
                 /api/*      │                   │ (chat en tiempo real)
                             ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│               backend-express/  (Express 5 + TypeScript)        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ server.ts                                                 │ │
│  │  helmet → cors → express.json → morgan                    │ │
│  │   → routers /api/* → Socket.io (mismo HTTP server)         │ │
│  │   → errorMiddleware (último, siempre)                     │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ routes/*  → middleware (auth/role/status/validate)         │ │
│  │          → controllers/* → services/* → models/* (Mongoose)│ │
│  │ sockets/  → chat.handler.ts (mensajería + ack de lectura)  │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────┘
                             │ Mongoose (mongodb://...)
                             ▼
                 ┌─────────────────────────┐
                 │   MongoDB (Docker)       │
                 │   docker-container/      │
                 │   mongodb-compose.yml    │
                 │   DB dev: educaspot      │
                 │   DB test: educaspot-test│
                 └─────────────────────────┘
```

**Flujo de una petición protegida típica** (ej. `POST /api/bookings`):

1. El cliente adjunta `Authorization: Bearer <token>` (interceptor de Axios
   en `frontend-react/src/services/api.ts`).
2. `authMiddleware` decodifica el JWT, busca el usuario fresco en Mongo y lo
   adjunta a `req.user`.
3. `statusMiddleware` bloquea si el usuario está `suspended` (salvo rutas de
   la lista blanca: `/api/auth/me`, `/api/auth/logout`, `/api/appeals`).
4. `roleMiddleware('student')` (o los roles que aplique) verifica el rol.
5. `validate(schema)` parsea y limpia `req.body`/`req.query` con Zod.
6. El controller delega la lógica de negocio real al `service`
   correspondiente (p. ej. `booking.service.ts::createBooking`) y responde.
7. Cualquier `ApiError` lanzado en el camino cae en `errorMiddleware`, el
   único lugar que escribe una respuesta de error.

**Comunicación en tiempo real**: el chat usa Socket.io sobre el mismo
servidor HTTP (`setupSockets(io)` en `server.ts`). El handshake de conexión
exige el mismo JWT que REST, enviado como `auth.token` (no como header, por
ser WebSocket) — ver `src/sockets/index.ts`. Cada socket se une a una room
personal `user:<id>` para recibir mensajes dirigidos sin necesidad de salas
por conversación: un mensaje llega a todas las pestañas de ambos
participantes aunque no tengan abierta esa conversación.

## 3. Componentes principales del backend

Backend en `backend-express/src/`, Express 5 + TypeScript + Mongoose 9 +
Socket.io. Capas: `routes/` → `middleware/` → `controllers/` → `services/` →
`models/`.

### Modelos (`src/models/`, Mongoose)

| Modelo | Responsabilidad |
|---|---|
| `User.ts` | Único modelo para estudiante/tutor/admin (`role`). Incluye `address` embebida (`street` + `coords: {lat, lng}`), `categoryIds` (afinidades del estudiante) y `tutorData` embebida (bio, `cvUrl`, `portfolioUrl`, `baseRate`, `ratePerKm`, `categories`, `avgRating`, `reviewCount`, `approved`) solo para tutores. Hook `pre('save')` hashea `password` con bcrypt. `password`/`resetPasswordToken`/`resetPasswordExpires` son `select: false`. |
| `Category.ts` | Categorías académicas con jerarquía opcional (`parentId` auto-referenciado) y `slug` único. |
| `Course.ts` | Oferta de un tutor dentro de una categoría: título, descripción, `modalities` (`virtual`/`presencial-tutor`/`presencial-estudiante`), `baseRate`, `ratePerKm`. |
| `Availability.ts` | Disponibilidad semanal recurrente de un tutor: arreglo de `ITimeSlot {dayOfWeek, startMinute, endMinute}`. Un tutor tiene como máximo un documento (`tutorId` `unique`). |
| `Booking.ts` | Reserva entre estudiante y tutor para un curso concreto: `startsAt`/`endsAt` (Date), `status` (`pending`/`confirmed`/`completed`/`cancelled`), `priceBreakdown` embebido (`baseAmount`, `distanceKm`, `transportAmount`, `total`), `recurringGroupId` opcional para agrupar reservas creadas por el checkbox "repetir N semanas". |
| `Message.ts` | Mensaje de chat; `threadId` es `${userA}_${userB}` con IDs ordenados alfabéticamente (no hay colección de "conversación" separada); `readBy` registra lectura. |
| `Review.ts` | Reseña 1-5 estrellas + comentario, ligada 1:1 a un `Booking` (`bookingId` `unique`) — solo se puede reseñar una vez por reserva completada. |
| `Report.ts` | Reporte de convivencia de un usuario contra otro (`reason`: inasistencia/conducta/cobros/otro), con flujo de estado `open → reviewing → resolved/dismissed`. |
| `Appeal.ts` | Apelación de un usuario suspendido (`status`: pending/accepted/rejected), resuelta por un admin con `adminResponse` + `resolvedAt`. |

### Controllers (`src/controllers/`)

Cada uno expone funciones async `(req, res, next)` que **nunca** responden el
error directamente — siempre `next(error)` hacia `errorMiddleware`:

- `auth.controller.ts` — `register`, `login`, `logout` (no-op, token sin
  estado), `me`, `googleStub` (D4, ver §10), `forgotPassword`/`resetPassword`.
- `user.controller.ts` — `getMe`, `updateMe`, `completeOnboarding` (marca
  `onboardingCompleted` tras el wizard de 5 pasos del frontend).
- `category.controller.ts` — `listCategories` (pública), `createCategory` /
  `deleteCategory` (exportadas pero **sin router propio montado** — ver
  nota de F4 abajo).
- `course.controller.ts` — CRUD de cursos del tutor autenticado +
  `listCourses`/`getCourse` públicos.
- `availability.controller.ts` — `setMyAvailability`, `getMyAvailability`,
  `getTutorAvailability` (pública, para que el estudiante vea huecos libres).
- `booking.controller.ts` — `createBookingController` (convierte
  `startsAt` de string ISO a `Date` antes de delegar al servicio — ver bug
  documentado en §8), `getMyBookings`, `cancelBookingController`,
  `completeBookingController`.
- `tutor.controller.ts` — `searchTutorsController` (filtro por categoría,
  radio, precio — delega en `search.service.ts`), `getTutorPublicProfile`.
- `geo.controller.ts` — `calculateDistance` (expone `haversineKm` como
  endpoint `POST /api/geo/distance`, usado por el frontend para previsualizar
  costo de traslado antes de reservar).
- `review.controller.ts` — `createReview` (valida que el booking esté
  `completed` y pertenezca al estudiante), `getTutorReviews`.
- `report.controller.ts` — `createReport`, `getMyReports`.
- `appeal.controller.ts` — `createAppeal`, `getMyAppeals`.
- `chat.controller.ts` — `getChatThreads`, `getThreadMessages` (historial
  REST; los mensajes nuevos viajan por Socket.io, no por aquí).
- `admin.controller.ts` — el controller más grande: CRUD de categorías,
  `adminListReports`/`adminResolveReport`, `adminListAppeals`/
  `adminResolveAppeal`, `adminSuspendUser`/`adminReactivateUser`,
  `adminListUsers`, `adminAnalytics` (agregación Mongo para el dashboard),
  `adminApproveTutor`/`adminListPendingTutors`. Mezcla un helper local
  `requireAdmin(req)` (funciones viejas) con checks inline
  `req.user?.role !== 'admin'` (funciones nuevas) — redundante porque
  `admin.routes.ts` ya gatea todo el router con `roleMiddleware('admin')`,
  pero se deja así a propósito por consistencia con los briefs del plan.

### Servicios (`src/services/`) — lógica de negocio pura, sin HTTP

- `geo.service.ts` — `haversineKm(a, b)` (distancia en km entre dos
  `{lat,lng}`), `calculateTripPrice(...)`, `toGeoJsonPoint` (utilidad no
  usada para indexar, ver §8).
- `booking.service.ts` — `createBooking`/`cancelBooking`/`completeBooking`.
  Aquí vive la lógica anti-traslape: dos reservas chocan si
  `s1 < e2 && s2 < e1`; se verifica por separado contra las reservas
  `pending`+`confirmed` del tutor y del estudiante. Si el tutor no tiene
  `Availability` creada, no se aplica ninguna restricción de horario
  (comportamiento intencional, no bug).
- `search.service.ts` — `searchTutors(params)`: trae candidatos por
  categoría/aprobación, luego filtra por radio y precio **en memoria**
  (Haversine sobre el array ya traído), no con operadores geoespaciales de
  Mongo (ver §8/§10, bug documentado del índice `2dsphere`).

### Middlewares (`src/middleware/`)

- `auth.ts` — lee `Authorization: Bearer <token>`, verifica el JWT,
  re-consulta el usuario en Mongo (para reflejar cambios de rol/estado sin
  relogin) y lo adjunta a `req.user`.
- `status.ts` — bloquea usuarios `suspended` salvo la lista blanca
  (`/api/auth/me`, `/api/auth/logout`, `/api/appeals`).
- `role.ts` — `roleMiddleware(...allowedRoles)`, usado a nivel de router
  (`course.routes.ts`, `availability.routes.ts`, `admin.routes.ts`, etc.).
- `validate.ts` — envuelve un schema Zod como middleware; reemplaza
  `req.body` con los datos ya parseados, o guarda resultados de query en
  `req.validatedQuery` (porque `req.query` no se puede reasignar en
  Express 5).
- `error.ts` — único lugar que escribe una respuesta de error; registra con
  `logger.error` (nunca se silencia, ni en producción).

### Utilidades (`src/utils/`)

- `errors.ts` — subclases de `ApiError`: `BadRequest`, `Unauthorized`,
  `Forbidden`, `NotFound`, `Conflict`, `InternalError`.
- `jwt.ts` — `signToken`/`verifyToken` (HS256, expiración configurable por
  `JWT_EXPIRES_IN`).
- `validators.ts` — todos los schemas Zod de la API.
- `logger.ts` — wrapper de Winston (`info`/`warn`/`error`/`debug`); escribe
  `logs/combined.log` + `logs/error.log` y consola coloreada en dev.

### Sockets (`src/sockets/`)

`index.ts` monta un middleware de autenticación de Socket.io (mismo JWT que
REST, vía `socket.handshake.auth.token`) y une cada conexión a la room
`user:<id>`. `chat.handler.ts` implementa el chat estilo WhatsApp (D7 — ver §10);
`presence.ts` lleva en memoria cuántos sockets tiene cada usuario.

| Evento (cliente → servidor) | Efecto |
|---|---|
| `chat:join` / `chat:leave` | Abre/cierra una conversación: devuelve datos del contacto y su presencia, y suscribe a `presence:update` |
| `chat:message` `{ otherUserId, content, clientId }` | Guarda y emite `chat:message` a ambos usuarios; `clientId` hace idempotente el reenvío |
| `chat:read` `{ messageIds }` | Marca como leídos (solo mensajes ajenos de sus threads) y emite `chat:read` al remitente |
| `chat:typing` `{ otherUserId, isTyping }` | Retransmite "escribiendo…" al otro usuario (efímero) |

Eventos servidor → cliente: `chat:message`, `chat:delivered` (el destinatario
recibió; también al conectarse tras estar offline), `chat:read`, `chat:typing`
y `presence:update` (en línea / `lastSeenAt`). El estado de cada mensaje propio
se deriva de `deliveredTo` / `readBy`: ✓ enviado, ✓✓ entregado, ✓✓ azul leído.
La presencia en memoria es válida para una sola instancia del servidor.

### Rutas montadas en `server.ts`

`/api/auth`, `/api/users`, `/api/categories` (solo `GET /` pública — el
CRUD admin de categorías existe en el controller pero **no tiene router
montado**, es trabajo intencionalmente diferido a F4), `/api/courses`,
`/api/availability`, `/api/bookings`, `/api/tutors` (`/search`, `/:id`),
`/api/geo`, `/api/reviews`, `/api/reports`, `/api/appeals`, `/api/admin`.

## 4. Componentes principales del frontend

`frontend-react/` está scaffoldeado sobre **Vite + React 19 + TypeScript**
(no Create React App). Dependencias clave: `react-router-dom` 7, `zustand`
5, `axios`, `socket.io-client`, `react-leaflet` + `leaflet` (mapas),
`date-fns`, `lucide-react` (iconos). Estilos con **SASS Modules** (`sass`
como devDependency), no Tailwind ni CSS-in-JS. Lint con `oxlint`
(`.oxlintrc.json`), no ESLint.

### Estructura de carpetas (`src/`)

```
src/
├── components/
│   ├── auth/        AuthBrandPanel, RoleSelector
│   ├── bookings/    BookingCard
│   ├── layout/       Header, Footer, ProtectedRoute, ThemeToggle, ComingSoon
│   ├── map/          MapPicker (Leaflet, selección de dirección)
│   ├── onboarding/   OnboardingProgress + 4 Step* (wizard de 5 pasos)
│   ├── tutors/        BookingWidget, SearchMap, TutorResultItem
│   └── ui/            Button, Input, Modal, Textarea (design system base)
├── hooks/            un hook por caso de uso de datos (ver abajo)
├── pages/            una carpeta por sección de ruta (public/tutors/tutor/
│                     bookings/onboarding/admin/suspension)
├── services/         api.ts (axios), socket.ts, geo.ts, geocode.ts,
│                     categoryMatch.ts, formatters.ts
├── store/            authStore.ts, themeStore.ts, socketStore.ts (Zustand)
├── styles/           global.scss, _variables.scss, _theme.scss, _mixins.scss
├── types/            api.ts, user.ts, index.ts
├── App.tsx           dispara authStore.initialize() una vez al montar
└── router.tsx         <Routes> declarativas + <ProtectedRoute>
```

Cada componente/página con estilos propios usa un **CSS Module** sidecar
(`Nombre.module.scss`), nunca estilos globales sueltos fuera de
`global.scss`.

### Patrón de hooks (`src/hooks/`)

Un hook de datos por caso de uso (no un hook de API genérico): `useAuth`,
`useAvailability`/`useMyAvailability`, `useBookings`, `useCategories`,
`useTutorProfile`, `useNearbySearch`, `useOnboardingWizard`,
`useLoginForm`/`useRegisterForm`, `useGeolocation`, `useSocketConnection`, y
el espejo admin (`useAdmin`, `useAdminAnalytics`, `useAdminCategories`,
`useAdminModeration`, `useAdminTutors`, `useAdminUsers`). Cada hook
encapsula: estado `isLoading`/`error`/`data`, la llamada a `services/api.ts`
o al store de Zustand correspondiente, y la lógica de UI del caso de uso
(p. ej. `useMyAvailability` expone `isSelected`/`toggleCell`/`beginPaint`/
`paintCell`/`endPaint` para la cuadrícula de "pintar" disponibilidad por
clic-y-arrastre, en vez de envolver una librería de calendario — ver §10,
D1). Se re-exportan todos desde `hooks/index.ts` como barrel file.

### Zustand stores (`src/store/`)

- `authStore.ts` — `user`, `isAuthenticated`, `isLoading`, `isSuspended`;
  acciones `initialize` (lee el token de `localStorage` bajo la clave
  `edumarket_token` y llama a `/auth/me`), `login`, `register`,
  `googleStub`, `logout`, `refreshUser`. Es el único lugar que escribe el
  token en `localStorage` (`TOKEN_KEY` importado de `services/api.ts`).
- `themeStore.ts` — `theme: 'light' | 'dark' | null` (`null` = sigue al
  S.O.); `setTheme`/`toggle`; persiste en `localStorage` (`edumarket_theme`)
  y aplica `data-theme` en `<html>`. `index.html` aplica el tema de forma
  síncrona antes del primer paint para evitar parpadeo (FOUC); el store solo
  mantiene React sincronizado después.
- `socketStore.ts` — gestiona la conexión de `socket.io-client` y su ciclo
  de vida, consumida por `useSocketConnection`.

Zustand se eligió sobre Redux/Context por no requerir un `<Provider>` — se
ve explícitamente en `App.tsx`, que llama `useAuthStore.getState()` fuera de
cualquier árbol de componentes.

### Sistema de rutas (`src/router.tsx`)

`react-router-dom` 7 con `<Routes>`/`<Route>` declarativas (no
`createBrowserRouter` basado en objetos). `ProtectedRoute` envuelve toda
ruta que requiera sesión y opcionalmente una lista `allowedRoles` (p. ej.
`/mis-reservas` solo `student`, `/tutor/*` solo `tutor`, `/admin` solo
`admin`, usando rutas anidadas con `<Route index>` para el layout del panel
de administración). Rutas aún no implementadas en profundidad usan el
componente `<ComingSoon icon title description>` en vez de un 404 o una
pantalla vacía — ver `/chat`, pendiente de Fase 4. `AppRouter` bloquea el
render con un "Cargando…" mientras `useAuth().isLoading` es `true`, para no
parpadear contenido protegido antes de que `authStore.initialize()`
resuelva.

### Capa de API (`src/services/api.ts`)

Instancia única de Axios (`baseURL: '/api'`). Un interceptor de request
agrega `Authorization: Bearer <token>` leyendo `localStorage` en cada
llamada (nunca cookies — coherente con el backend, ver §8). Un interceptor
de response detecta `401` y limpia la sesión + redirige a `/login?expired=1`
(con guarda para no hacer loop si ya se está en `/login`/`/register`).
`getErrorMessage(error)` extrae el campo `error` del cuerpo JSON que emite
`errorMiddleware` del backend, para mostrarlo tal cual (ya viene en
español) en los formularios.

## 5. TypeScript: path aliases y convenciones de tipos

### Path aliases (solo backend)

`backend-express/tsconfig.json` define, sin `baseUrl` (eliminado a propósito
para que el aliasing siga funcionando cuando TypeScript 7 retire el soporte
de `baseUrl` — cada entrada usa una ruta explícita `./src/...`):

| Alias | Resuelve a |
|---|---|
| `@/*` | `./src/*` |
| `@models/*` | `./src/models/*` |
| `@controllers/*` | `./src/controllers/*` |
| `@services/*` | `./src/services/*` |
| `@middleware/*` | `./src/middleware/*` |
| `@routes/*` | `./src/routes/*` |
| `@utils/*` | `./src/utils/*` |
| `@sockets/*` | `./src/sockets/*` |
| `@config/*` | `./src/config/*` |
| `@types/*` | `./src/types/*` |

Dos mecanismos distintos resuelven estos alias según cómo corre el código,
y **ambos** son necesarios:

- `tsx` (scripts `dev`/`seed`) — lee `paths` de `tsconfig.json` y resuelve los
  alias en tiempo de ejecución, sin plugins adicionales.
- `tsc-alias` como paso de post-procesamiento de `npm run build` — reescribe
  los alias a rutas relativas `require(...)` dentro del `dist/*.js` emitido,
  así el output compilado no depende en tiempo de ejecución de
  `tsconfig.json`.

`vitest.config.mts` (nótese `.mts`, no `.ts`) replica el mismo mapa en
`resolve.alias` a mano, porque Vite/Vitest no soporta de forma nativa los
`paths` de `tsconfig.json` — hay que mantener ambos sincronizados cuando se
agrega un alias nuevo.

El frontend (`frontend-react/`) no define path aliases propios; sus imports
son relativos (`../../hooks`, `../../services/formatters`, etc.), visibles
en los ejemplos de `router.tsx` y `Analytics.tsx` citados arriba.

### Convenciones de tipos

- **Interfaces de documento Mongoose**: prefijo `I` — `IUser`, `ICourse`,
  `IBooking`, `IAvailability`, `ITimeSlot`, `ICategory`, `IMessage`,
  `IReview`, `IReport`, `IAppeal`, `IAddress`, `ITutorData`,
  `IPriceBreakdown` (todas en `src/models/*.ts` o `src/types/express.d.ts`).
  Cada interfaz extiende `Document` de Mongoose e incluye `_id: Types.ObjectId`,
  `createdAt`/`updatedAt` cuando el schema usa `{ timestamps: true }`.
- **Tipos inferidos/derivados**: prefijo `T` para tipos que no son un
  documento Mongoose completo sino una forma derivada (p. ej. tipos de
  payload de request/response, proyecciones parciales). En el código
  presente, los tipos de unión simples (`UserRole`, `UserStatus`,
  `Modality`, `BookingStatus`, `AppealStatus`, `ReportStatus`,
  `ReportReason`) se declaran sin prefijo por ser literales de cadena, no
  tipos inferidos de un modelo — la convención `T`-prefix aplica cuando se
  deriva un tipo de un modelo con utilidades de TypeScript (`Pick`,
  `Omit`, `ReturnType`, etc.), no a estos enums.
- **Nombres de archivo**: `kebab-case.ts` en el backend (`booking.service.ts`,
  `search.service.ts`); componentes React en `PascalCase.tsx`
  (`BookingCard.tsx`, `TutorResultItem.tsx`) con su sidecar de estilos
  `PascalCase.module.scss`.
- `strict: true`, `noImplicitAny: true`, `strictNullChecks: true` en ambos
  `tsconfig.json` — no hay `any` implícito tolerado en ninguno de los dos
  proyectos.

## 6. SASS: sistema de diseño y modo light/dark

Tres archivos parciales se combinan vía `@use`/`@forward` (no `@import`,
deprecado en Dart Sass moderno):

- **`_variables.scss`** — variables SCSS (`$color-primary`, `$space-4`,
  `$radius-lg`, `$motion-fast`, `$ease-standard`, `$bp-md`, `$z-modal`, …).
  La mayoría de los colores y sombras **no son valores fijos**: son
  referencias `var(--...)` hacia custom properties CSS definidas en
  `_theme.scss`, de modo que el resto del código SCSS sigue escribiendo
  `$color-primary` como si fuera estático, pero el valor real cambia según
  el tema activo sin tocar ninguna hoja de estilos que lo consuma.
- **`_theme.scss`** — define la escala de color base (`--primary-50` a
  `--primary-900`, naranja quemado; `--neutral-0` a `--neutral-950`, gris
  puro) en `:root`, y dos bloques de tokens semánticos:
  - **Light mode** (el bloque `:root` directo): `--color-bg: var(--neutral-50)`,
    `--color-surface: var(--neutral-0)`, `--color-text: var(--neutral-700)`,
    sombras tintadas con el primary (`rgba(183, 62, 23, 0.06…0.14)`, nunca
    negro puro).
  - **Dark mode** (mixin `dark-tokens`, aplicado por dos selectores
    distintos — ver abajo): invierte superficies y texto a la escala de
    neutros oscuros (`--color-bg: var(--neutral-950)`, `--color-text:
    var(--neutral-50)`) pero **no redeclara** `--color-primary`/
    `--color-danger`/etc.: el mismo naranja (`--primary-700`/`-800`) se usa
    como texto/fondo de botón en ambos temas, porque es el único tono que
    cumple WCAG AA de contraste en los dos casos a la vez (documentado
    inline en el propio archivo: `primary-500` da 3.5:1 y `primary-600`
    3.95:1 como fondo de botón, ambos insuficientes).
  - Activación: `@media (prefers-color-scheme: dark)` aplica `dark-tokens`
    automáticamente salvo que `:root` tenga `[data-theme='light']`
    explícito; `:root[data-theme='dark']` lo fuerza manualmente sin
    depender de la preferencia del sistema operativo. El toggle
    (`ThemeToggle.tsx` + `themeStore.ts`) escribe ese atributo.
- **`_mixins.scss`** — `respond-below($bp)`/`respond-above($bp)` (breakpoints
  `sm`/`md`/`lg` sobre `$bp-sm`/`$bp-md`/`$bp-lg`), `flex-center`,
  `flex-between`, `truncate($lines)` (clamp de 1 o N líneas),
  `card` (superficie + borde + radio + sombra estándar), `button-base`
  (estructura compartida de todos los botones, con estado `:disabled`),
  `focus-ring` (outline de accesibilidad con `:focus-visible`, color
  `$color-primary`).

Cada componente/página consume estos parciales vía su propio
`Nombre.module.scss` (`@use '../../styles/variables' as *;` o equivalente),
nunca escribe valores de color/espaciado crudos — así un cambio de tema o de
escala de espaciado se propaga sin tocar cada módulo.

## 7. Diagrama entidad-relación

El archivo `diagrama_casos_uso_plataforma_tutorias.puml` (raíz del repo) es
un **diagrama de casos de uso** PlantUML (actores: Visitante, Usuario
autenticado, Estudiante, Tutor, Administrador, Google OAuth 2.0, servicio de
mapas, Socket.io, pagos-mockup), útil como referencia de los flujos
funcionales (CU-01 a CU-11 de autenticación/onboarding, y paquetes
posteriores de gestión de tutores, reservas, chat, moderación), pero **no**
es un diagrama entidad-relación de datos — no modela colecciones ni
cardinalidades. El ER real, derivado directamente de `src/models/*.ts`, es
el siguiente:

```
┌───────────────┐        1   ┌──────────────┐
│    User        │───────────│  Availability │   (1 tutor : 0..1 disponibilidad,
│ (student/tutor/│  tutorId  │  tutorId      │    tutorId es unique)
│  admin)        │  unique   │  slots[]      │
└───────┬────────┘           └──────────────┘
        │ 1
        │ tutorId
        │ N
┌───────▼────────┐        N        1 ┌───────────────┐
│    Course       │────────────────── │   Category     │
│  tutorId        │   categoryId      │  parentId? ──┐ │ (auto-referencia,
│  categoryId     │                   │  (jerarquía)  │ │  categorías anidadas)
│  modalities[]   │                   └───────────────┘◄┘
│  baseRate       │
└───────┬────────┘
        │ 1
        │ courseId
        │ N
┌───────▼─────────────────────┐
│          Booking             │   studentId ──► User (role=student)
│  studentId, tutorId,         │   tutorId    ──► User (role=tutor)
│  courseId, startsAt, endsAt, │
│  status, priceBreakdown,     │
│  recurringGroupId?           │
└───────┬───────────┬─────────┘
        │ 1          │ 1
        │ bookingId  │ (indirecta vía
        │ unique     │  reporterId/targetUserId)
┌───────▼────────┐  ┌▼──────────────┐
│    Review        │  │    Report      │
│  tutorId          │  │  reporterId    │──► User
│  studentId        │  │  targetUserId  │──► User
│  bookingId (1:1)  │  │  reason/status │
│  rating 1-5        │  └───────────────┘
└───────────────────┘

┌───────────────┐             ┌───────────────┐
│    Message      │             │    Appeal      │
│  threadId        │             │  userId         │──► User (suspendido)
│  ("userA_userB") │             │  status         │
│  senderId        │──► User    │  adminResponse? │
│  readBy[]        │──► User[]  └───────────────┘
└───────────────────┘
```

**Relaciones clave (cardinalidad)**:

- `User` 1 — 0..1 `Availability` (un tutor tiene a lo sumo un documento de
  disponibilidad; `tutorId` tiene índice `unique`).
- `User` (tutor) 1 — N `Course` (un tutor publica varios cursos).
- `Category` 1 — N `Course`, y `Category` 1 — N `Category` (auto-referencia
  vía `parentId`, jerarquía opcional de categorías).
- `User` (student) 1 — N `Booking`, `User` (tutor) 1 — N `Booking`, `Course`
  1 — N `Booking`.
- `Booking` 1 — 0..1 `Review` (`bookingId` `unique`: máximo una reseña por
  reserva, y solo se puede crear si el booking está `completed`).
- `User` 1 — N `Report` como `reporterId`, `User` 1 — N `Report` como
  `targetUserId` (relación doble al mismo modelo).
- `User` 1 — N `Appeal` (un usuario suspendido puede apelar).
- `Message` no tiene colección de "conversación": `threadId` es una clave
  compuesta determinística (`${userA}_${userB}` con IDs ordenados
  alfabéticamente), así dos usuarios siempre caen en el mismo hilo sin
  necesidad de una tabla intermedia.

## 8. Decisiones técnicas clave

- **Auth por header Bearer, no por cookie httpOnly.** La implementación
  original (antes de que apareciera el enunciado de la asignación,
  `README.md` en la raíz) usaba cookies httpOnly. El enunciado exige
  explícitamente "Toda petición protegida al backend debe validar el Bearer
  Token en los headers" / "deberá ser enviado en los headers de cada
  solicitud", así que se migró: `register`/`login`/`googleStub` devuelven
  `{ user, token }` en el cuerpo JSON (no hay ningún `Set-Cookie` en la
  API), `authMiddleware` lee `req.headers.authorization`, y el paquete
  `cookie-parser` fue **desinstalado** del proyecto, no solo dejado sin
  usar. El frontend guarda el token en `localStorage` bajo la clave
  `edumarket_token` (`authStore.ts`) y lo reenvía en cada petición vía el
  interceptor de Axios de `services/api.ts`. `logout` es un no-op en el
  servidor — un JWT sin estado no tiene sesión que invalidar del lado del
  servidor; el cliente simplemente descarta el token.
- **Geo-búsqueda en memoria, no `2dsphere`.** El modelo `User.address.coords`
  es un objeto plano `{lat, lng}` (decisión original del plan), pero un
  índice `2dsphere` de MongoDB exige GeoJSON (`{type:'Point', coordinates:
  [lng, lat]}`) — crear ese índice sobre el schema actual provoca
  `MongoServerError: can't project geometry into spherical CRS` en cuanto se
  inserta o actualiza cualquier `User` con dirección. Se optó por **eliminar
  el índice `2dsphere`** y filtrar por radio con Haversine en memoria sobre
  los candidatos ya traídos de Mongo (`search.service.ts`), igual que ya se
  hacía para el filtro de precio. Esto coincide con el fallback D8 que el
  propio plan maestro documentó ("cálculo en memoria, no escala") —
  aceptable para el volumen de datos de un proyecto académico, no para
  producción a escala.
- **`Booking.startsAt` se convierte explícitamente a `Date` en el
  controller.** El cuerpo JSON de `POST /api/bookings` trae `startsAt` como
  string ISO 8601 (`express.json()` no lo coacciona), pero
  `booking.service.ts::createBooking` llama `.getTime()` asumiendo un
  `Date` real — fallaba con `TypeError: startsAt.getTime is not a function`
  en toda petición HTTP real (los tests a nivel de servicio no lo detectaron
  porque llaman `createBooking()` directamente con un `Date` ya
  construido). Se corrigió haciendo `new Date(req.body.startsAt)` en
  `booking.controller.ts` antes de delegar al servicio.
- **`tsc-alias` + copia manual de `src/public/` en el build.** `npm run
  build` es `tsc && tsc-alias && node -e "...cpSync(...)"`, no un `tsc`
  simple: sin `tsc-alias`, el JS compilado conserva literalmente
  `require("@middleware/auth")`, que Node no resuelve en runtime (a
  diferencia de `tsx`, que sí resuelve alias vía `tsconfig.json`); y `tsc` nunca copia archivos no-`.ts` (como
  `favicon.ico`) a `dist/`.
- **Usuario no-root en Docker, pero con `logs/` pre-creado y con dueño
  correcto.** El `Dockerfile` corre como `USER node` por seguridad, pero
  Winston crea `./logs` relativo a `dist/` (es decir, `/app/logs`) la
  primera vez que se requiere, y `/app` es de `root` por defecto en la
  imagen — se agregó `RUN mkdir -p logs && chown -R node:node /app` **antes**
  de `USER node` para evitar `EACCES` al arrancar.
- **`npm run dev` en Windows y procesos zombi.** `tsx watch`
  vigila `src/**`; un `kill $PID` en PowerShell/Git Bash a menudo no mata el
  `node.exe` subyacente — sigue reteniendo el puerto 4000 y resucita en el
  siguiente guardado de archivo. Hay que ubicar el PID real con
  `netstat -ano | grep :4000` y usar `taskkill //PID <pid> //F`.
- **`vitest.config.mts` con `fileParallelism: false`.** Todos los tests de
  integración comparten una sola base de datos Mongo real
  (`educaspot-test`); con paralelismo de archivos activo (el default de
  Vitest), el `beforeEach`/`afterAll` de un archivo (que hace
  `deleteMany({})`/`dropDatabase()` sobre **todas** las colecciones) puede
  correr al mismo tiempo que el `beforeAll` de otro archivo y borrarle los
  fixtures a medio setup — exactamente lo que pasó al agregar
  `booking.test.ts` junto a `auth.test.ts` ("Tutor no encontrado" de forma
  intermitente) hasta desactivar el paralelismo.
- **Zustand sin `Provider`.** Se prefirió sobre Redux/Context precisamente
  porque `App.tsx` necesita disparar `useAuthStore.getState().initialize()`
  una sola vez al montar, fuera de cualquier árbol de componentes — con
  Context eso exigiría un componente envoltorio adicional solo para ese
  efecto.

## 9. Seguridad

- **`helmet`** — cabeceras HTTP de seguridad por defecto (mitiga
  clickjacking, MIME-sniffing, etc.), montado como primer middleware global
  en `server.ts`.
- **`cors`** — restringe qué orígenes pueden invocar la API (el frontend
  Vite en desarrollo, el origen de producción cuando aplique).
- **`bcryptjs`** — hashing de contraseñas con `genSalt(10)` en el hook
  `pre('save')` de `User.ts`, solo si `password` fue modificado
  (`this.isModified('password')`) — evita rehashear en cada `save()` que no
  toque la contraseña. El hook se declara `async function () {}` **sin**
  parámetro `next`: Mongoose 9 pasa un objeto `SaveOptions` (no un callback)
  como primer argumento a los hooks que sí declaran `next`, así que
  declararlo reintroduce un `TypeError: next is not a function` en cada
  `save()`.
- **JWT (`jsonwebtoken`)** — `signToken`/`verifyToken` en `src/utils/jwt.ts`,
  firmado HS256 con `JWT_SECRET` (mínimo 32 caracteres, validado por Zod en
  `src/config/env.ts`, que aborta el proceso con `process.exit(1)` si falta
  o es corto). Expiración configurable vía `JWT_EXPIRES_IN`. El token viaja
  únicamente en el header `Authorization: Bearer <token>` (REST) o en
  `handshake.auth.token` (Socket.io) — nunca en una cookie ni en la URL.
- **Campos sensibles con `select: false`** — `password`,
  `resetPasswordToken`, `resetPasswordExpires` nunca se incluyen en una
  consulta `User.find()`/`findById()` normal; hay que pedirlos
  explícitamente con `.select('+password')` cuando se necesitan (login,
  cambio de contraseña).
- **Validación con Zod (`src/utils/validators.ts` + `middleware/validate.ts`)**
  — todo `req.body` que entra a un controller ya fue parseado y limpiado por
  un schema Zod antes de llegar; los `req.query` validados se guardan aparte
  en `req.validatedQuery` porque Express 5 no permite reasignar `req.query`
  directamente.
- **Autorización por rol (`roleMiddleware`)** — gatea routers completos
  (`admin.routes.ts`, `course.routes.ts`, `availability.routes.ts`, etc.)
  antes de que la petición llegue al controller, en vez de depender
  únicamente de checks inline dentro de cada función.
- **Bloqueo de cuentas suspendidas (`statusMiddleware`)** — corre después de
  `authMiddleware`; una cuenta `suspended` solo puede llamar a
  `/api/auth/me`, `/api/auth/logout` y `/api/appeals` (para poder apelar la
  suspensión), todo lo demás responde `403 Forbidden`.
- **Logging de errores sin excepción** — `logger.error` en
  `middleware/error.ts` nunca se silencia (a diferencia de `info`/`debug`,
  que sí se silencian en `NODE_ENV=production`), para que un fallo en
  producción quede siempre registrado en `logs/error.log`.

## 10. Limitaciones conocidas / stubs (D1-D10)

La tabla D1-D10 fue una decisión explícita, documentada en
`.omo/plans/plan-edumarket.md` (sección de alcance/riesgos), de simplificar
deliberadamente ciertos requisitos del enunciado original para que el
proyecto fuera viable en el tiempo disponible (entrega solo, due
2026-10-18). Estado real verificado en el código al momento de este manual:

| # | Requisito original del enunciado | Implementación real (stub aceptado) | Alternativa completa (fuera de alcance) |
|---|---|---|---|
| D1 | Vistas de calendario Diaria/Semanal/Mensual | Cuadrícula de 7 días × horas, interacción de "pintar" por clic-y-arrastre (`useMyAvailability`, `TutorAvailabilityPage`) — sin librería de calendario | `react-big-calendar` con las 3 vistas |
| D2 | Suscripción periódica de 4 u 8 semanas | Checkbox "Repetir N semanas" que crea N documentos `Booking` individuales agrupados por `recurringGroupId` | Motor de recurrencia real con job programado |
| D3 | Ruta trazada en el mapa | Ruta real por calles con OSRM (`geo.service.ts::getRoute`, `POST /api/geo/route`), dibujada con Leaflet en `RouteMap` dentro del formulario de reserva. La distancia de la ruta es la que se cobra (`quoteTrip`) y se guarda en la reserva. Si OSRM no responde o `OSRM_URL` está vacío, cae a línea recta Haversine (trazo punteado) para no bloquear reservas | Servidor OSRM propio: el demo público (`router.project-osrm.org`) es solo para desarrollo |
| D4 | OAuth 2.0 real con Google | `POST /api/auth/google` (`googleStub`) acepta un payload simulado (`{email, name, role}` o `photoUrl`) y emite un JWT real — **sin** verificación de identidad real contra Google | `passport-google-oauth20` con verificación de id_token |
| D5 | Hoja de vida en PDF | Campo `cvUrl` (string, URL a archivo externo/LinkedIn/portafolio) en `tutorData` | Subida real de archivo con `multer` + almacenamiento (S3/disco) |
| D6 | Gráficos estadísticos dinámicos | `AdminAnalyticsPage` arma gráficos de barras/dona con CSS puro sobre los tokens del design system (clases `sliceA`…`sliceF`), sin librería de charting | Chart.js o Recharts con gráficos interactivos |
| D7 | Confirmación de lectura en chat | Checks estilo WhatsApp (✓ enviado → ✓✓ entregado → ✓✓ azul leído) vía eventos de Socket.io en `chat.handler.ts`; `Message.deliveredTo` y `Message.readBy` persisten en Mongo | — (ya cumple el requisito, con mecanismo simplificado) |
| D8 | Búsqueda geoespacial con `$geoWithin` + índice `2dsphere` | Cálculo de distancia en memoria (Haversine) sobre los candidatos ya filtrados por categoría — ver bug/decisión documentada en §8 | Índice `2dsphere` real (exige migrar `address.coords` a GeoJSON) |
| D9 | Políticas de convivencia editables | Página estática `/politicas` (`PoliciesPage`) con texto fijo en el componente | CMS editable desde el panel de administración |
| D10 | Foto de perfil | Campo `photoUrl` (string, URL externa o vacío) en `User` | Subida real con `multer` |

Además, se detectó durante el desarrollo que la ruta admin de creación/
eliminación de categorías (`adminCreateCategory`/`adminUpdateCategory`/
`adminDeleteCategory` en `admin.controller.ts`, y las funciones equivalentes
exportadas en `category.controller.ts`) **existe en código pero no tiene
router montado en `server.ts`** — es trabajo intencionalmente diferido a la
Fase 4 del plan (gestión de categorías vía UI de administración), no un
olvido a corregir sin más contexto.

El target de despliegue documentado (`render.yaml`, `Dockerfile`,
`.dockerignore`) es evidencia de portabilidad del backend (se verificó con
un `docker build` + `docker run` real contra el contenedor de Mongo), pero
el despliegue efectivo del proyecto para la entrega es local
(`npm run dev` + Mongo en Docker Compose), no un deploy real a Render.

## 11. Sistema de diseño: tabla de tokens

Valores reales extraídos de `frontend-react/src/styles/_variables.scss` y
`_theme.scss` (no inventados). Los colores semánticos y las sombras son
`var(--...)` porque cambian entre modo claro y oscuro; se listan ambos
valores donde difieren.

### Colores — escala primaria (naranja quemado, invariante entre temas)

| Token | Valor |
|---|---|
| `--primary-50` | `#fef6ee` |
| `--primary-100` | `#fcebd8` |
| `--primary-200` | `#f9d3af` |
| `--primary-300` | `#f5b47c` |
| `--primary-400` | `#ef8c48` |
| `--primary-500` | `#eb6d24` |
| `--primary-600` | `#dc541a` |
| `--primary-700` | `#b73e17` |
| `--primary-800` | `#9b361c` |
| `--primary-900` | `#762c18` |

### Colores — escala neutra (gris puro, invariante entre temas)

| Token | Valor |
|---|---|
| `--neutral-0` | `#ffffff` |
| `--neutral-50` | `#fafafa` |
| `--neutral-100` | `#f2f2f2` |
| `--neutral-200` | `#e3e3e3` |
| `--neutral-300` | `#cccccc` |
| `--neutral-400` | `#a3a3a3` |
| `--neutral-500` | `#787878` |
| `--neutral-600` | `#5c5c5c` |
| `--neutral-700` | `#424242` |
| `--neutral-800` | `#2b2b2b` |
| `--neutral-900` | `#171717` |
| `--neutral-950` | `#0a0a0a` |

### Colores — semánticos (light / dark)

| Token | Light | Dark |
|---|---|---|
| `$color-primary` (`--color-primary`) | `var(--primary-700)` = `#b73e17` | igual (invariante) |
| `$color-primary-dark` | `var(--primary-800)` = `#9b361c` | igual |
| `$color-primary-light` | `var(--primary-600)` = `#dc541a` | igual |
| `$color-danger` | `#b84141` | igual (invariante) |
| `$color-danger-dark` | `#8a2f2f` | igual |
| `$color-warning` | `#b8860b` | igual |
| `$color-warning-dark` | `#8a6308` | igual |
| `$color-success` | `var(--primary-700)` = `#b73e17` | igual |
| `$color-success-dark` | `var(--primary-800)` = `#9b361c` | igual |
| `$color-info` | `#2e7d8c` | igual |
| `--color-bg` | `var(--neutral-50)` = `#fafafa` | `var(--neutral-950)` = `#0a0a0a` |
| `--color-surface` | `var(--neutral-0)` = `#ffffff` | `var(--neutral-900)` = `#171717` |
| `--color-surface-alt` | `var(--neutral-100)` = `#f2f2f2` | `var(--neutral-800)` = `#2b2b2b` |
| `--color-surface-container-lowest` | `var(--neutral-0)` | `var(--neutral-950)` |
| `--color-surface-container-low` | `var(--neutral-50)` | `var(--neutral-900)` |
| `--color-surface-container` | `var(--neutral-100)` | `var(--neutral-800)` |
| `--color-surface-container-high` | `var(--neutral-200)` | `var(--neutral-700)` |
| `--color-surface-container-highest` | `var(--neutral-300)` | `var(--neutral-600)` |
| `--color-text` | `var(--neutral-700)` = `#424242` | `var(--neutral-50)` = `#fafafa` |
| `--color-text-muted` | `var(--neutral-600)` = `#5c5c5c` | `var(--neutral-300)` = `#cccccc` |
| `--color-text-light` | `var(--neutral-500)` = `#787878` | `var(--neutral-400)` = `#a3a3a3` |
| `--color-border` | `var(--neutral-200)` = `#e3e3e3` | `var(--neutral-700)` = `#424242` |
| `--color-border-strong` | `var(--neutral-300)` = `#cccccc` | `var(--neutral-600)` = `#5c5c5c` |
| `--on-accent-text` | `#ffffff` | `#ffffff` (invariante) |

Nota de accesibilidad documentada inline en `_theme.scss`: `--color-primary`
usa `primary-700`/`-800` (no el `primary-500` "base" de la escala) porque es
el único tono que cumple WCAG AA tanto como texto sobre fondo claro/oscuro
como fondo de botón con texto blanco en ambos temas; `primary-500` (3.5:1) y
`primary-600` (3.95:1) fallan AA como fondo de botón.

### Sombras (tintadas, no negro puro) — light / dark

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(183, 62, 23, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.3)` |
| `--shadow-md` | `0 4px 8px -2px rgba(183, 62, 23, 0.08), 0 2px 4px -2px rgba(183, 62, 23, 0.06)` | `0 4px 8px -2px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)` |
| `--shadow-lg` | `0 12px 20px -6px rgba(183, 62, 23, 0.10), 0 4px 8px -4px rgba(183, 62, 23, 0.08)` | `0 12px 20px -6px rgba(0, 0, 0, 0.5), 0 4px 8px -4px rgba(0, 0, 0, 0.4)` |
| `--shadow-xl` | `0 24px 32px -8px rgba(183, 62, 23, 0.14), 0 8px 12px -6px rgba(183, 62, 23, 0.10)` | `0 20px 28px -8px rgba(0, 0, 0, 0.6), 0 8px 12px -6px rgba(0, 0, 0, 0.5)` |

### Tipografía

| Token | Valor |
|---|---|
| `$font-base` | `'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (UI/formularios/navegación) |
| `$font-display` | `'Petrona', Georgia, 'Times New Roman', serif` (solo `h1`, momentos de marca — nunca en botones/controles) |
| `$font-size-xs` | `0.75rem` |
| `$font-size-sm` | `0.875rem` |
| `$font-size-base` | `1rem` |
| `$font-size-lg` | `1.125rem` |
| `$font-size-xl` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.3rem)` |
| `$font-size-2xl` | `clamp(1.3rem, 1.15rem + 0.7vw, 1.6rem)` |
| `$font-size-3xl` | `clamp(1.5rem, 1.2rem + 1.3vw, 2rem)` |
| `$font-size-4xl` | `clamp(1.85rem, 1.35rem + 2.3vw, 2.75rem)` |

Los tamaños `xl` a `4xl` son fluidos (`clamp()`), escalan continuamente con
el viewport entre los breakpoints en vez de saltar en un punto fijo.

### Espaciado

| Token | Valor |
|---|---|
| `$space-1` | `0.25rem` |
| `$space-2` | `0.5rem` |
| `$space-3` | `0.75rem` |
| `$space-4` | `1rem` |
| `$space-5` | `1.25rem` |
| `$space-6` | `1.5rem` |
| `$space-8` | `2rem` |
| `$space-10` | `2.5rem` |
| `$space-12` | `3rem` |
| `$space-16` | `4rem` |

### Breakpoints

| Token | Valor |
|---|---|
| `$bp-sm` | `640px` |
| `$bp-md` | `768px` |
| `$bp-lg` | `1024px` |
| `$bp-xl` | `1280px` |

### Radios

| Token | Valor |
|---|---|
| `$radius-sm` | `0.075rem` |
| `$radius-md` | `0.125rem` |
| `$radius-lg` | `0.375rem` |
| `$radius-xl` | `0.625rem` |
| `$radius-full` | `9999px` (reservado a chips y barra de progreso) |

La escala de radios es deliberadamente contenida (no 12/16px) — valores más
grandes se consideraron "molde de SaaS genérico" durante el diseño del
sistema (comentario inline en `_variables.scss`).

### Motion (duración y easing)

| Token | Valor |
|---|---|
| `$motion-instant` | `100ms` |
| `$motion-fast` | `180ms` |
| `$motion-base` | `280ms` |
| `$motion-slow` | `420ms` |
| `$motion-ambient` | `700ms` |
| `$ease-standard` | `cubic-bezier(0.2, 0.0, 0, 1)` |
| `$ease-enter` | `cubic-bezier(0.0, 0, 0.2, 1)` |
| `$ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` |
| `$ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `$transition-fast` | `$motion-fast $ease-standard` (alias retrocompatible) |
| `$transition-normal` | `$motion-base $ease-standard` |
| `$transition-slow` | `$motion-slow $ease-standard` |

Las duraciones son semánticas (nombradas por su rol), no valores fijos
arbitrarios; `ease-in-out`/`linear` como timing de transición y los easings
tipo bounce/elastic están prohibidos por el propio sistema de diseño
(`DESIGN.md` §12, referenciado en el comentario de `_variables.scss`).

### Z-index

| Token | Valor |
|---|---|
| `$z-dropdown` | `1000` |
| `$z-sticky` | `1100` |
| `$z-modal` | `1200` |
| `$z-toast` | `1300` |
