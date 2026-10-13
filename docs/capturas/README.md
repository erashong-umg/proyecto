# Capturas de pantalla — EducaSpot

Este directorio contiene las capturas de pantalla reales de los flujos
principales de la aplicación, referenciadas desde `docs/manual-usuario.md`
y `docs/demo-script.md`. Se generaron navegando la app real (backend +
frontend corriendo localmente, datos del seed más algunas acciones de
prueba) el 2026-10-12.

## Capturas disponibles

| # | Archivo | Descripción |
|---|---------|-------------|
| 01 | `01-home.png` | Página de inicio (vista autenticada como estudiante) |
| 02 | `02-register.png` | Formulario de registro |
| 03 | `03-onboarding.png` | Wizard de onboarding, paso 1 (datos personales) |
| 04 | `04-login.png` | Formulario de login |
| 05 | `05-busqueda-tutores.png` | Búsqueda de tutores con mapa (`/tutores`) |
| 06 | `06-perfil-tutor.png` | Perfil de un tutor (`/tutores/:id`) |
| 07 | `07-reserva.png` | Perfil completo + widget de reserva lleno, antes de confirmar |
| 08 | `08-anti-traslape.png` | Error real de anti-traslape al reservar el mismo horario dos veces |
| 09 | `09-mis-reservas.png` | Vista "Mis reservas" del estudiante, con una reserva completada y una confirmada |
| 10 | `10-chat.png` | Chat en tiempo real (`/chat`) con un mensaje real enviado vía Socket.io |
| 11 | *(no disponible)* | Modal de reseña/calificación — no existe todavía UI para redactar una reseña (ver `docs/manual-usuario.md` §10 y `docs/demo-script.md` acto 7) |
| 12 | `12-dashboard-tutor.png` | Dashboard del tutor (`/tutor/dashboard`) |
| 13 | `13-disponibilidad.png` | Grilla de disponibilidad semanal del tutor (`/tutor/disponibilidad`) |
| 14 | `14-admin-dashboard.png` | Dashboard del panel de administración (`/admin`) con datos reales |
| 14b | `14b-admin-suspender-modal.png` | Extra: modal de confirmación al suspender un usuario |
| 15 | `15-admin-analytics.png` | Analytics del admin — los 3 charts SVG con datos reales |
| 16 | `16-suspension.png` | Pantalla de cuenta suspendida, con el formulario de apelación |

Nota: en la captura 16, los campos "Motivo" y "Fecha del bloqueo" aparecen
vacíos ("No especificado"/"No disponible") aunque el admin sí ingresó un
motivo al suspender — es un bug real y pre-existente en
`backend-express/src/middleware/auth.ts::authMiddleware`, que arma `req.user`
con un `.select('role status name email')` que no incluye
`suspensionReason`/`suspensionDate`. No se corrigió en esta sesión por tocar
el middleware de autenticación global (fuera del alcance de admin/chat/docs).

Si alguna pantalla cambia significativamente, regenerar con `npm run dev` en
ambos proyectos y Win+Shift+S en Windows / Cmd+Shift+4 en macOS, o repitiendo
el flujo de automatización de navegador usado para esta tanda.
