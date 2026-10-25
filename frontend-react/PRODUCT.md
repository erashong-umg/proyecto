# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary roles, plus an administrator:
- **Estudiantes**: buscan tutores cercanos por categoría/materia, reservan sesiones presenciales, gestionan sus reservas, y califican/reportan después de la sesión.
- **Tutores**: publican cursos/materias que enseñan, definen su disponibilidad semanal y radio/ubicación, aprueban o gestionan reservas entrantes, y pasan por un proceso de aprobación antes de aparecer en las búsquedas.
- **Administrador** (interno, fuera del flujo de los dos anteriores): aprueba tutores, gestiona categorías, revisa reportes y apelaciones. Su panel está pendiente de implementación (Fase 4).

## Product Purpose

EducaSpot conecta estudiantes con tutores para clases particulares **presenciales** en Guatemala. El estudiante busca por materia/categoría y encuentra tutores cerca de su ubicación real (no solo por ciudad), agenda una sesión en un horario disponible, y ambas partes se reúnen en persona. Éxito = una reserva confirmada y completada entre un estudiante y un tutor geográficamente viable.

## Positioning

El mecanismo distintivo frente a un directorio genérico de tutores es el **emparejamiento por cercanía real**: la plataforma calcula distancia/ruta real entre tutor y estudiante (actualmente Haversine en línea recta, ver constraints) para priorizar quién es logísticamente viable, en vez de filtrar solo por ciudad o departamento. Esto es coherente con que las sesiones son presenciales — la distancia no es un dato decorativo, es el filtro de búsqueda central.

## Operating Context

- Las sesiones son **presenciales**: tutor y estudiante se reúnen en una ubicación física acordada. El mapa y el cálculo de distancia no son secundarios — son el mecanismo principal de búsqueda/match.
- Flujo típico estudiante: registro → onboarding (datos personales, dirección/ubicación, categorías de interés) → buscar tutores en el mapa → ver perfil de tutor → reservar un bloque de disponibilidad → esperar confirmación → asistir a la sesión → calificar/reportar.
- Flujo típico tutor: registro → onboarding (datos personales, dirección, materias/tarifas, categorías) → esperar aprobación de admin → publicar cursos → definir disponibilidad semanal → gestionar reservas entrantes → dar clases.
- Chat en tiempo real (Socket.io) entre tutor y estudiante existe en el backend pero su UI es un placeholder "Próximamente" — pendiente de Fase 4.
- Un usuario puede quedar **suspendido** (vista dedicada de suspensión, acceso bloqueado salvo rutas específicas); puede apelar la suspensión.

## Capabilities and Constraints

Backend (Express/Mongoose) ya construido y estable; frontend consume vía `Authorization: Bearer <token>` (no hay cookies) guardado en `localStorage`. Restricciones deliberadas y conocidas del alcance académico — no "arreglar" sin preguntar primero:

- **Login con Google** es un stub: acepta un payload simulado y emite un JWT real, pero no hay flujo OAuth real.
- **CV y foto de perfil** son strings de URL — no hay subida de archivos.
- **Ruta en el mapa** tutor↔estudiante es una línea recta (Haversine), no un motor de ruteo real.
- **Calendario** es solo vista semanal; una casilla "repetir N semanas" crea N reservas individuales, no una recurrencia real.
- **Búsqueda geográfica** filtra por radio en memoria (Haversine sobre candidatos ya traídos de Mongo), no con `$geoWithin`/índice `2dsphere` — decisión explícita, no bug, apropiada para el volumen de datos de un proyecto académico.
- Backend categorías admin (crear/eliminar) existen como funciones pero sus rutas no están montadas todavía — trabajo de Fase 4, igual que el panel de administración y el chat en el frontend.
- Proyecto académico individual (Universidad Mariano Gálvez), fecha límite **2026-10-18**. Despliegue real no es el objetivo — `render.yaml`/`Dockerfile` en el backend son solo evidencia de portabilidad.

## Brand Commitments

- Nombre del producto: **EducaSpot** (título de página: "EducaSpot — Marketplace Educativo"); el nombre interno de proyecto "EduMarket" aparece en algunas llaves internas pero el nombre de marca visible al usuario es EducaSpot.
- Idioma: todo el copy de UI está en español de Guatemala, con **"usted" formal** (nunca tuteo); fechas/moneda usan locale `es-GT`; moneda es Quetzales (Q).
- Identidad visual ya definida y en aplicación ("Verde Quetzal"): verde quetzal `#0f7a5c` como color primario, tipografía Fraunces serif solo en `h1`/momentos destacados y Public Sans/Inter para UI, logomarca de "dos puntos unidos por línea punteada" (referencia directa a la ruta/distancia tutor↔estudiante), íconos exclusivamente `lucide-react` (nunca emoji). Este sistema ya vive en `src/styles/_variables.scss` y los componentes — documentarlo formalmente es trabajo de `/impeccable document`, no de este archivo.

## Evidence on Hand

Ninguno real todavía: no hay testimonios, casos de estudio, ni datos de producción. El backend tiene un script de seed (`npm run seed`) que genera usuarios/datos demo (1 admin, 3 tutores, 2 estudiantes, 5 categorías) para desarrollo y pruebas — no son evidencia de uso real y no deben presentarse como tal en la UI.

## Product Principles

1. La distancia/ubicación real es el filtro central de la búsqueda, no un adorno — toda decisión de UI de búsqueda/match debe mantener esa jerarquía.
2. El copy es siempre formal ("usted"), en español de Guatemala, con moneda en Quetzales y fechas en formato `es-GT`.
3. No inventar evidencia, testimonios ni funcionalidad que no exista — las limitaciones conocidas (OAuth stub, sin subida de archivos, ruta recta, calendario semanal) se comunican honestamente en la UI donde aplique, no se disfrazan de funcionalidad completa.
4. Nuevo trabajo visual parte del sistema "Verde Quetzal" ya establecido (tokens, tipografía, logomarca, íconos lucide) en vez de reinventar paleta o estilo.
5. El panel de administración y el chat son explícitamente Fase 4 — las rutas placeholder ("Próximamente") son intencionales, no deuda técnica a resolver de inmediato.

## Accessibility & Inclusion

Ningún estándar formal (p. ej. WCAG) está establecido todavía como requisito de la rúbrica del curso ni por decisión propia del usuario. Se sigue buena práctica general (atributos ARIA, foco de teclado, contraste razonable) sin comprometerse a un nivel de conformidad específico por ahora.
