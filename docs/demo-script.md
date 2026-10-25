# Guion de demostración — EducaSpot

> Proyecto académico de la Universidad Mariano Gálvez. Entrega: 2026-10-18.
> Documento interno de preparación para la presentación en vivo. Describe,
> acto por acto, qué mostrar, en qué pantalla y con qué cuenta, con un
> presupuesto total de **15 minutos**. No incluye capturas de pantalla: es
> un guion narrado para ensayar y seguir durante la demo real. Para el
> detalle de cada pantalla tal como está implementada, véase
> `docs/manual-usuario.md`; para arquitectura y decisiones técnicas,
> `docs/manual-tecnico.md`.

---

## Setup antes del demo

Completar **todo** lo siguiente antes de que empiece la presentación, no
durante:

1. **Base de datos sembrada.** Desde `backend-express/`, con el contenedor
   de MongoDB corriendo (`docker compose -f docker-container/mongodb-compose.yml up -d`):

   ```bash
   npm run seed
   ```

   Esto limpia y recrea los datos de demo descritos en la tabla de
   credenciales más abajo (fuente: `backend-express/src/seed/seed.ts`).
   Ejecutarlo de nuevo justo antes de la presentación garantiza un estado
   limpio — sin reservas ni mensajes de ensayos anteriores.

2. **Servidores corriendo.** Dos terminales abiertas:
   - `backend-express/`: `npm run dev` (puerto 4000).
   - `frontend-react/`: `npm run dev` (puerto de Vite, normalmente 5173).

3. **Verificación de compilación.** Justo antes de la demo, correr en ambos
   proyectos para confirmar que no hay nada roto de último momento:

   ```bash
   npm run typecheck && npm run build
   ```

   (en `backend-express/` y en `frontend-react/`, cada uno desde su propia
   carpeta). Si algo falla aquí, es preferible saberlo ahora que en vivo.

4. **Dos navegadores o dos perfiles de Chrome listos**, uno para el rol de
   estudiante y otro para el rol de tutor — necesarios para el Acto 6 (chat
   en tiempo real), donde ambos lados de la conversación deben verse
   simultáneamente. Recomendado: una ventana normal de Chrome + una ventana
   de incógnito, o dos perfiles de Chrome distintos ya logueados por
   separado antes de empezar, para no perder tiempo iniciando sesión dos
   veces en vivo.

5. **Credenciales de demo a la mano** (todas las contraseñas siguen el
   patrón `<Rol>123!`, tomadas de `backend-express/src/seed/seed.ts`):

   | Correo | Contraseña | Rol / estado |
   |---|---|---|
   | `admin@educaspot.gt` | `Admin123!` | Administrador |
   | `maria@educaspot.gt` | `Tutor123!` | Tutora aprobada — Inglés y JavaScript |
   | `juan@educaspot.gt` | `Tutor123!` | Tutor aprobado — Natación |
   | `carlos@educaspot.gt` | `Tutor123!` | Tutor **pendiente** de aprobación |
   | `ana@educaspot.gt` | `Est123!` | Estudiante (tiene un booking completado + reseña de ejemplo con María) |
   | `luis@educaspot.gt` | `Est123!` | Estudiante |

   La cuenta de `ana@educaspot.gt` es la protagonista de casi todo el guion
   porque el seed ya le dejó una tutoría completada y una reseña hecha a
   María — útil para el Acto 7.

---

## Guion — 15 minutos, 8 actos

### Acto 1 — Contexto del proyecto [1 min]

Hablado, sin tocar la aplicación todavía (o con la página de inicio `/` ya
abierta de fondo).

- EducaSpot es un marketplace de tutorías académicas para Guatemala:
  conecta estudiantes que buscan un tutor cercano con tutores que ofrecen
  cursos a una tarifa por hora, de forma virtual o presencial.
- Tres roles: **estudiante**, **tutor**, **administrador** (modera la
  plataforma: aprueba tutores, resuelve denuncias y apelaciones, ve
  analítica).
- Stack: Express 5 + TypeScript + MongoDB/Mongoose + Socket.io en el
  backend; React en el frontend. Proyecto académico individual, backend
  completo (F1/F2) y frontend completo (F3/F4) ya construidos.

### Acto 2 — Registro de cuenta nueva [1.5 min]

En el navegador principal (perfil de "estudiante"):

1. Ir a `/register` desde el botón **"Crear cuenta"** del encabezado.
2. Elegir rol **Estudiante** (mencionar que esta elección es definitiva
   desde este formulario — determina los pasos de onboarding siguientes).
3. Llenar nombre, un correo nuevo (ej. `demo.estudiante@educaspot.gt`),
   contraseña que cumpla la política (mínimo 8 caracteres, una mayúscula,
   un número) y su confirmación.
4. Presionar **Crear cuenta** → el sistema redirige automáticamente a
   `/onboarding`, sin permitir el uso del resto de la plataforma hasta
   completarlo.

### Acto 3 — Onboarding paso a paso [2 min]

Continuando con la cuenta recién creada, recorrer los 3 pasos que le
corresponden a un estudiante (mencionar que un tutor vería un cuarto paso
adicional — información profesional — que se omite aquí por tiempo):

1. **Datos personales**: teléfono/WhatsApp y género.
2. **Ubicación**: escribir una dirección (ej. "Zona 10, Ciudad de
   Guatemala") y presionar **Ubicar en el mapa**, o arrastrar el pin
   directamente — mencionar que esta dirección es la que luego alimenta el
   cálculo de distancia a los tutores.
3. **Categorías de interés**: seleccionar al menos una categoría (ej.
   Idiomas) como chip.
4. Presionar **Finalizar** → redirige a `/` con la cuenta ya lista para
   usarse.

### Acto 4 — Login como estudiante, búsqueda de tutores y perfil [2.5 min]

Cerrar sesión de la cuenta recién creada e iniciar sesión con la cuenta de
demo ya poblada por el seed, que tiene historial:

1. `/login` con `ana@educaspot.gt` / `Est123!`.
2. Ir a `/tutores` (**"Buscar tutores"**). Aceptar el permiso de
   ubicación del navegador (o mencionar que, si se rechaza, cae de forma
   automática a la dirección registrada en el onboarding).
3. Mostrar el mapa con los pines de tutores cercanos y el listado al lado
   (distancia en km, calificación, tarifa).
4. Escribir "inglés" en el buscador por categoría y presionar **Buscar**
   para filtrar.
5. Hacer clic en el resultado de **María López** para abrir `/tutores/:id`:
   mostrar biografía, cursos ofrecidos (con sus modalidades) y la sección
   de reseñas (aquí ya aparece la reseña de 5 estrellas que el seed dejó
   de Ana a María — se retoma en el Acto 7).

### Acto 5 — Reserva de clase y anti-traslape [3 min]

Seguir en el perfil de María López, sección **"Reservar una tutoría"**:

1. Elegir el curso "Inglés conversacional para profesionales", modalidad
   **Virtual**, duración **60 minutos**, una fecha futura cercana (ej.
   mañana) y una hora cualquiera (ej. 10:00 a.m.) — recordar que en
   modalidad virtual la hora es libre, no depende de la disponibilidad
   semanal del tutor.
2. Mostrar el desglose de precio (sin costo de traslado, por ser virtual)
   y presionar **Confirmar reserva** → mensaje de éxito.
3. **Demostración del anti-traslape**: repetir el mismo formulario con
   María, mismo curso, misma fecha, pero una hora que se traslape con la
   reserva recién creada (ej. 10:30 a.m., que choca con el bloque de
   10:00–11:00 ya reservado). Presionar **Confirmar reserva** de nuevo.
   - El sistema debe rechazarla mostrando el motivo del conflicto
     (internamente, el backend responde 409 con un mensaje del tipo
     "Usted ya tiene una tutoría en la semana 1 (...)"). Ver la respuesta
     técnica a P3 más abajo para la explicación exacta del algoritmo.
4. Ir a `/mis-reservas` para mostrar la reserva confirmada en la lista de
   tarjetas, con su botón **Cancelar** disponible.

### Acto 6 — Chat en tiempo real (requiere 2 navegadores) [2 min]

1. En el navegador/perfil de **estudiante** (Ana, ya logueada), ir a
   `/chat`. Mencionar la limitación conocida: la bandeja solo muestra
   conversaciones que ya tienen al menos un mensaje previo (no hay botón
   para iniciar una conversación nueva desde el perfil de un tutor) — por
   eso la conversación demo debe existir de antemano o iniciarse sobre una
   ya existente si el seed la dejó, o bien enviarse el primer mensaje desde
   el lado del backend/consola si fuera necesario para tener algo que
   abrir en ambos lados antes de la demo.
2. En el segundo navegador/perfil, iniciar sesión como **María López**
   (`maria@educaspot.gt` / `Tutor123!`) y abrir la misma conversación desde
   su propia bandeja de entrada.
3. Enviar un mensaje desde el lado de Ana y mostrar que aparece de
   inmediato en la pantalla de María (y viceversa), sin recargar la
   página — esto es lo que demuestra que el canal es Socket.io en vivo y no
   un simple polling por HTTP.
4. Mencionar brevemente el indicador "Conectando…" que aparece si la
   conexión en tiempo real se está restableciendo, y que el campo de envío
   se deshabilita mientras tanto (se retoma en la respuesta a P4).

### Acto 7 — Reseñas (limitación de UI) y reportes [1 min]

Este acto se ajusta deliberadamente a lo que existe hoy en la interfaz, sin
prometer un flujo que no está construido:

1. Volver al perfil de María López (`/tutores/:id`) y señalar la reseña de
   5 estrellas de Ana ("Excelente profesora, muy paciente...") que ya se
   mostró en el Acto 4 — explicar que viene de un booking marcado como
   **completado** en el seed, y que las reseñas se muestran de forma
   pública en el perfil del tutor.
2. **Ser explícito sobre la limitación conocida**: hoy no existe, en
   ninguna pantalla de la aplicación, un formulario o botón para que un
   estudiante redacte una reseña nueva o para que cualquier usuario
   presente una denuncia/reporte sobre otro — ambos casos están
   documentados como pendientes en `docs/manual-usuario.md` (secciones 11
   y, en la nota de la sección 9.4, reseñas). El backend sí expone los
   endpoints (`/api/reviews`, `/api/reports`) y el modelo de datos
   completo; lo que falta es la UI para consumirlos desde el navegador.
   Mencionar que, mientras tanto, el canal para reportar una conducta
   indebida es el correo de soporte, y que las reseñas y denuncias que sí
   existen (como la de Ana) fueron creadas directamente vía seed/API para
   tener datos de ejemplo que mostrar en el Acto 8.

### Acto 8 — Panel de administración: analytics y moderación [2 min]

Cerrar sesión e iniciar como `admin@educaspot.gt` / `Admin123!`:

1. `/admin` — dashboard con indicadores generales (usuarios totales,
   tutores pendientes, denuncias abiertas, apelaciones pendientes, cursos
   activos, reservas del último mes). Señalar que **Carlos Mendoza**
   aparece como tutor pendiente de aprobación (así quedó en el seed).
2. `/admin/analytics` — mostrar las tres gráficas: top 5 tutores por
   calificación (María debería aparecer bien posicionada gracias a su
   reseña), demanda por categoría (dona) y reservas del último mes por
   estado (líneas) — esta última debería reflejar la reserva creada en el
   Acto 5.
3. `/admin/moderacion` — mostrar las dos pestañas (Denuncias y
   Apelaciones) y su flujo de resolución, aunque la base de demo esté
   vacía de casos reales: explicar verbalmente el ciclo (abierta → en
   revisión → resuelta/descartada; pendiente → aceptada/rechazada para
   apelaciones).
4. Cierre: `/admin/tutores` — aprobar en vivo a **Carlos Mendoza** como
   ejemplo del flujo de aprobación, para terminar la demo con una acción
   concreta y visible (su cuenta pasa de pendiente a aprobada al instante).

---

## Preguntas frecuentes anticipadas

### P1 — ¿Por qué el login de Google es un stub y no OAuth real?

Es una decisión de alcance documentada desde el día 1 del proyecto (tabla
D1–D10 de `.omo/plans/plan-edumarket.md`, decisión **D4**): el endpoint
`POST /api/auth/google` acepta un payload simulado (`{ email, name,
photoUrl }`) y devuelve un JWT real del sistema, pero no implementa
`passport-google-oauth20` ni verifica un identity token real de Google. Fue
una decisión consciente para no desviar tiempo de desarrollo (apretado,
proyecto solo) hacia la configuración de credenciales OAuth de un proveedor
externo, cuando el valor académico está en demostrar el flujo de
autenticación y emisión de JWT, no en la integración particular con Google.
La alternativa completa (`passport-google-oauth20` real) queda identificada
en el plan como trabajo futuro, no como algo pendiente de esta entrega.

### P2 — ¿Cómo se calcula la distancia y el costo de traslado?

Con una ruta real por calles. Al elegir la modalidad "a domicilio del
estudiante", el frontend pide `POST /api/geo/route` y el backend consulta un
servidor OSRM (`geo.service.ts::getRoute`, configurable con `OSRM_URL`). El
mapa dibuja la trayectoria entre el tutor y el domicilio, y muestra
distancia y tiempo estimado en auto. El costo de traslado es
`distancia de la ruta × tarifa por km del tutor`, y esa misma distancia es la
que se guarda en la reserva (`quoteTrip`), así el precio que se ve es el que
se cobra.

Si OSRM no responde, está deshabilitado o no encuentra ruta, el sistema cae a
la fórmula de Haversine (línea recta, trazo punteado en el mapa) y avisa que
la distancia es aproximada: un servicio externo caído nunca bloquea una
reserva. En producción conviene un OSRM propio, porque el servidor demo
público tiene límites de uso. La búsqueda por cercanía (D8) sigue usando
Haversine, a propósito: filtra muchos candidatos y no justifica una llamada
de ruteo por cada uno.

### P3 — ¿Cómo funciona el anti-traslape de reservas?

La lógica vive en `backend-express/src/services/booking.service.ts`, no en
el controlador. La regla matemática es la estándar para solapamiento de
intervalos: dos intervalos `[s1, e1)` y `[s2, e2)` se solapan si y solo si
`s1 < e2 && s2 < e1`. Concretamente, la función `hasOverlap` busca en la
colección `Booking` cualquier reserva con `status` en `pending` o
`confirmed` (las canceladas o completadas no cuentan) donde
`startsAt < endsAt_nueva && endsAt > startsAt_nueva`, y esa búsqueda se
hace **dos veces, por separado**: una filtrando por `tutorId` (¿el tutor ya
tiene algo que choca?) y otra filtrando por `studentId` (¿el estudiante ya
tiene algo que choca?). Si cualquiera de las dos encuentra una coincidencia,
`createBooking` lanza un error `Conflict` (HTTP 409) con un mensaje que cita
la semana del conflicto (relevante cuando se usa la opción "Repetir N
semanas", que valida el traslape de cada ocurrencia semanal por separado
antes de crear ninguna). Antes de llegar a esa validación también se
confirma, si la modalidad no es virtual, que el horario cae dentro de los
bloques de disponibilidad semanal que el tutor configuró
(`tutorIsAvailable`); si el tutor no tiene ningún documento de
disponibilidad registrado, no se aplica ninguna restricción — eso es
intencional, no un bug.

### P4 — ¿Qué pasa si no hay conexión o el socket se desconecta en el chat?

El cliente usa `socket.io-client` (ver `frontend-react/src/services/socket.ts`
y `useSocketConnection`), que trae reconexión automática incorporada: si la
conexión se cae, el cliente reintenta conectarse sin intervención del
usuario. Mientras el socket no está en estado conectado, la pantalla de
chat muestra un indicador "Conectando…" y el campo de envío de mensajes se
deshabilita explícitamente — esto es deliberado, para no dejar que el
usuario escriba un mensaje que nunca llegaría a enviarse y le haga creer
que sí se envió. No hay, por ahora, una cola de mensajes pendientes que se
reenvíen automáticamente al reconectar: si el usuario escribió algo durante
el corte, tendrá que reenviarlo una vez que la conexión vuelva (el campo se
reactiva solo cuando el socket confirma que está conectado de nuevo).

### P5 — ¿Por qué el calendario de disponibilidad es solo vista semanal y no mensual/diaria?

Decisión **D1** del plan: se implementó solo la vista semanal (una
cuadrícula de 7 días × horas) en vez de las tres vistas (diaria, semanal,
mensual) que en teoría ofrecería una librería como `react-big-calendar`.
El propio plan la marca como un riesgo gestionado explícitamente
("R1: Calendario consume más tiempo del estimado — Alta probabilidad, alto
impacto — mitigación: D1, solo vista semanal"): para un proyecto solo con
fecha de entrega fija, construir o integrar tres vistas de calendario
completas no aportaba valor académico adicional sobre demostrar que el
sistema de disponibilidad y reservas funciona correctamente, así que se
priorizó la vista que de hecho es la que necesita tanto el tutor (para
marcar sus bloques disponibles) como el formulario de reserva (para
consultarlos). Las vistas diaria y mensual quedan identificadas como
alternativa futura, no como un defecto a corregir antes de la entrega.
