# Manual de usuario — EducaSpot

> Proyecto académico de la Universidad Mariano Gálvez. Entrega: 2026-10-18.
> Este manual está dirigido al usuario final de la plataforma — estudiante,
> tutor o administrador — y describe el uso de la aplicación tal como está
> implementada al momento de su redacción. No es un manual técnico; para
> arquitectura y decisiones de desarrollo consulte `docs/manual-tecnico.md`.

## Índice

1. [Introducción](#1-introducción)
2. [Registro de cuenta](#2-registro-de-cuenta)
3. [Onboarding paso a paso](#3-onboarding-paso-a-paso)
4. [Inicio de sesión](#4-inicio-de-sesión)
5. [Búsqueda de tutores](#5-búsqueda-de-tutores)
6. [Perfil de un tutor](#6-perfil-de-un-tutor)
7. [Cómo reservar una clase](#7-cómo-reservar-una-clase)
8. [Mis reservas](#8-mis-reservas)
9. [Panel del tutor](#9-panel-del-tutor)
10. [Chat en tiempo real](#10-chat-en-tiempo-real)
11. [Reportes y denuncias](#11-reportes-y-denuncias)
12. [Panel de administración](#12-panel-de-administración)
13. [Suspensión de cuenta](#13-suspensión-de-cuenta)
14. [Soporte y contacto](#14-soporte-y-contacto)

---

## 1. Introducción

**EducaSpot** es un mercado (marketplace) de tutorías académicas pensado para
Guatemala. Conecta a dos tipos de usuario con una necesidad complementaria:

- **Estudiantes**, que buscan un tutor cercano a su ubicación para aprender
  una materia, idioma, deporte u otra habilidad, ya sea de forma virtual o
  presencial.
- **Tutores**, que ofrecen sus conocimientos a través de cursos publicados en
  la plataforma, con una tarifa por hora y un horario de disponibilidad que
  ellos mismos configuran.

Un tercer tipo de usuario, el **administrador**, no participa en las
tutorías directamente, sino que mantiene la calidad y la sana convivencia de
la plataforma: aprueba a los tutores antes de que aparezcan en las
búsquedas, atiende denuncias entre usuarios, resuelve apelaciones de cuentas
suspendidas y consulta estadísticas generales de uso.

La aplicación se organiza alrededor de tres flujos principales:

- Para el **estudiante**: buscar un tutor en el mapa (`/tutores`), revisar su
  perfil (`/tutores/:id`), reservar una clase y dar seguimiento a sus
  tutorías desde "Mis reservas" (`/mis-reservas`).
- Para el **tutor**: configurar sus cursos y su disponibilidad semanal, y
  gestionar las reservas que los estudiantes le hacen, todo desde su panel
  (`/tutor/dashboard`).
- Para el **administrador**: todo lo anterior se supervisa desde el panel de
  administración (`/admin`).

Todos los usuarios, sin importar su rol, comparten además el sistema de
mensajería en tiempo real (`/chat`) y la página de políticas de convivencia
(`/politicas`).

A lo largo de este manual se usa el trato formal ("usted"), igual que en la
interfaz de la aplicación. Las imágenes referenciadas (`docs/capturas/`) son
marcadores de posición: las capturas reales de pantalla se añaden por
separado.

![Página de inicio de EducaSpot](capturas/01-inicio.png)

---

## 2. Registro de cuenta

La creación de cuenta se realiza desde `/register`, accesible también con el
botón **"Crear cuenta"** ubicado en la esquina superior derecha de cualquier
página cuando no ha iniciado sesión.

Pasos:

1. Ingrese a `/register` (o haga clic en **Crear cuenta** en el encabezado).
2. Elija su rol: **Estudiante** o **Tutor**. Esta elección es definitiva en
   este formulario — determina qué pasos del onboarding verá a
   continuación y no puede cambiarse después desde la interfaz.
3. Complete los campos:
   - **Nombre completo.**
   - **Correo electrónico** (debe ser único; si ya existe una cuenta con ese
     correo, el sistema se lo indicará).
   - **Contraseña**: debe tener al menos 8 caracteres, al menos una letra
     mayúscula y al menos un número.
   - **Confirmar contraseña**: debe coincidir exactamente con la anterior.
4. Presione **Crear cuenta**.
5. Si el registro es exitoso, el sistema lo redirige automáticamente a
   `/onboarding` para completar su perfil — no podrá usar el resto de la
   plataforma hasta terminar ese proceso (vea la sección siguiente).

Si ya tiene una cuenta, el enlace **"¿Ya tiene cuenta? Iniciar sesión"** al
final del formulario lo lleva a `/login`.

![Formulario de registro](capturas/02-registro.png)

---

## 3. Onboarding paso a paso

Después de registrarse, todo usuario nuevo pasa obligatoriamente por el
asistente de onboarding en `/onboarding`. Si su perfil ya fue completado
anteriormente, el sistema lo redirige automáticamente al inicio y no podrá
volver a ver este asistente.

El asistente tiene **4 pasos** para un tutor y **3 pasos** para un
estudiante (el estudiante no pasa por el paso de información profesional).
En la parte superior se muestra un indicador de progreso con el paso actual.

### Paso 1 — Datos personales

Se le saluda por su nombre y se le pide:

- **Teléfono / WhatsApp** (campo obligatorio, ej. `+502 5555-1234`).
- **Género**: Masculino, Femenino u Otro (selección única, obligatoria).

![Onboarding — paso 1, datos personales](capturas/03-onboarding-datos.png)

### Paso 2 — Ubicación

Esta dirección se usa después para calcular distancias en tutorías
presenciales (y, en el caso del estudiante, para la búsqueda de tutores
cercanos). El paso tiene dos formas de fijar la ubicación, que pueden
combinarse:

1. Escriba una descripción de su dirección (ej. "Zona 10, Ciudad de
   Guatemala") en el campo **Descripción de la dirección** y presione
   **Ubicar en el mapa**. El sistema intenta geocodificar el texto y, si lo
   encuentra, mueve el pin del mapa a esa ubicación y muestra un aviso de
   confirmación. Si no encuentra la dirección, o si el servicio de búsqueda
   no está disponible en ese momento, se lo indica y le pide ajustar el pin
   manualmente.
2. Arrastre el pin directamente sobre el mapa interactivo hasta la
   ubicación exacta. Las coordenadas resultantes (latitud/longitud) se
   muestran debajo del mapa.

El campo de descripción de la dirección es obligatorio para continuar;
el pin por defecto se ubica en el centro de la Ciudad de Guatemala hasta
que usted lo mueva o use la búsqueda.

![Onboarding — paso 2, ubicación en el mapa](capturas/04-onboarding-mapa.png)

### Paso 3 — Información profesional (solo tutores)

Este paso únicamente aparece si se registró con el rol de **Tutor**. Se le
solicita:

- **Biografía profesional** (obligatoria): texto libre donde cuenta su
  experiencia y metodología a los futuros estudiantes.
- **URL de CV / Portafolio** (obligatoria): enlace a LinkedIn o un sitio
  personal.
- **URL de portafolio** (opcional): un segundo enlace adicional.
- **Tarifa base por hora** en quetzales (debe ser mayor a 0).
- **Tarifa adicional por kilómetro de traslado** en quetzales por km, que
  solo se aplica cuando el tutor ofrece la modalidad "a domicilio del
  estudiante" (puede dejarse en 0 si no aplica).

Al final de este paso se le recuerda que su cuenta quedará en estado
**"pendiente de aprobación"** hasta que un administrador valide su perfil
(vea la sección 12, "Aprobación de tutores").

![Onboarding — paso 3, información profesional del tutor](capturas/05-onboarding-tutor.png)

### Paso 4 — Categorías de interés

El último paso es común a estudiantes y tutores, aunque el texto cambia
según el rol:

- Si es **tutor**, seleccione las categorías académicas en las que **ofrece
  clases** (ej. Matemática, Inglés, Natación).
- Si es **estudiante**, seleccione las categorías en las que **desea
  aprender**.

Las categorías se presentan como chips que se activan o desactivan con un
clic; debe seleccionar al menos una para poder finalizar.

![Onboarding — paso 4, selección de categorías](capturas/06-onboarding-categorias.png)

Al presionar **Finalizar** en el último paso, el sistema guarda todo el
perfil y lo redirige a la página de inicio (`/`), ya con acceso completo a
la plataforma. En cualquier paso posterior al primero puede usar el botón
**Atrás** para corregir información; si es estudiante, el botón **Atrás**
en el paso 4 lo regresa directamente al paso 2 (el paso 3 se salta por no
aplicarle).

---

## 4. Inicio de sesión

El inicio de sesión se realiza en `/login`, accesible con el botón
**"Iniciar sesión"** del encabezado.

Pasos:

1. Ingrese su **correo electrónico** y **contraseña**.
2. Presione **Iniciar sesión**.
3. Si las credenciales son correctas, se le redirige a la página que
   intentaba visitar antes de que se le pidiera autenticarse (o a la página
   de inicio si llegó directamente a `/login`).

Casos especiales que la pantalla de inicio de sesión reconoce
automáticamente:

- **Sesión expirada**: si su sesión caducó mientras navegaba y fue enviado
  de regreso a esta pantalla, se muestra un aviso "Su sesión expiró. Inicie
  sesión de nuevo." para que entienda por qué se le pidió autenticarse
  otra vez.
- **Cuenta suspendida**: si su cuenta está suspendida, el sistema lo
  redirige a `/suspension` en cuanto inicia sesión (vea la sección 13).

También puede ingresar con el botón de **Google** (se muestra solo si el
servicio está habilitado). Elija su cuenta de Google y el sistema inicia
sesión si ya tiene cuenta (si usted se había registrado con ese mismo correo, el
sistema la vincula). Para **crear** una cuenta con Google hay que hacerlo desde
**Crear cuenta**: primero elija arriba si es estudiante o tutor, y luego pulse
el botón de Google; se crea con el nombre, el correo y la foto de su cuenta de
Google y pasa al registro de su perfil (onboarding). Si pulsa el botón desde
**Iniciar sesión** y todavía no tiene cuenta, el sistema se lo indica y no crea
nada, porque el rol no se puede cambiar después. Las cuentas creadas con Google
no tienen contraseña: ingresan siempre con el botón de Google.

El enlace **"¿Olvidó su contraseña?"** se muestra en el formulario, pero a
la fecha de este manual la recuperación de contraseña no se encuentra
implementada en la aplicación — no complete ese flujo esperando un correo
de restablecimiento. Si olvidó su contraseña, comuníquese con soporte (vea
la sección 14).

![Formulario de inicio de sesión](capturas/07-login.png)

---

## 5. Búsqueda de tutores

La búsqueda de tutores vive en `/tutores`, accesible desde **"Buscar
tutores"** en el encabezado (visible incluso sin iniciar sesión, aunque la
ruta exige autenticación: si no ha iniciado sesión, se le pedirá hacerlo
primero).

Esta pantalla funciona de forma similar a una aplicación de transporte: un
mapa interactivo a un lado y un listado de resultados al otro.

1. **Ubicación**: al entrar, el navegador le pedirá permiso para conocer su
   ubicación actual (GPS). Acepte el permiso para que la búsqueda use su
   posición real.
   - Si rechaza el permiso, o su navegador no lo soporta, el sistema usa
     automáticamente la dirección que registró durante el onboarding (si
     existe). Un texto bajo el buscador indica cuál de las dos fuentes de
     ubicación está en uso ("Usando su ubicación actual" / "Usando su
     dirección registrada"), con un enlace para alternar entre ambas en
     cualquier momento.
   - Si ninguna ubicación está disponible, se le muestra un mensaje y un
     botón **"Intentar de nuevo"**.
2. En cuanto se conoce su ubicación, la aplicación muestra automáticamente
   **todos los tutores cercanos**, sin necesidad de escribir nada.
3. Para refinar la búsqueda por tema, escriba en el campo de texto (ej.
   "natación", "inglés") y presione **Buscar**. El texto se compara contra
   los nombres de categoría existentes; si no coincide con ninguna, se le
   avisa y de todas formas se muestran todos los tutores cercanos sin ese
   filtro.
4. En el **mapa**, su propia ubicación se marca con un punto distinto al de
   los tutores (representados con un pin de color). Al hacer clic sobre un
   pin de tutor se resalta y se abre una pequeña etiqueta con su nombre; el
   mapa también se centra y hace zoom automáticamente para mostrar a todos
   los tutores encontrados junto con su propia posición.
5. En el **listado**, cada resultado muestra foto o iniciales, nombre,
   distancia en kilómetros, calificación promedio (o "Nuevo/a" si aún no
   tiene reseñas), una de sus categorías, su tarifa base por hora y, si
   aplica, el costo adicional estimado de traslado. Al pasar el mouse o
   enfocar un resultado de la lista, el pin correspondiente se resalta en
   el mapa (y viceversa).
6. Haga clic sobre cualquier resultado para ir a su perfil completo.

Si no hay tutores cerca con el criterio usado, se muestra un estado vacío
indicándolo.

![Búsqueda de tutores con mapa](capturas/08-busqueda.png)

---

## 6. Perfil de un tutor

Al seleccionar un tutor desde la búsqueda se abre `/tutores/:id`, con toda
su información pública:

- **Encabezado**: foto (o iniciales si no tiene foto), nombre, calificación
  promedio con el número de reseñas recibidas (o "Sin calificaciones aún"
  si todavía no tiene ninguna), y su tarifa base por hora.
- **Acerca de**: la biografía profesional que el tutor escribió en su
  onboarding.
- **Cursos ofrecidos**: cada curso publicado por el tutor muestra título,
  categoría, descripción, las modalidades en que se imparte (virtual, en
  casa del tutor, o a domicilio del estudiante, cada una con su propio
  ícono) y su tarifa por hora. Si el tutor aún no publicó cursos, se indica
  explícitamente.
- **Reseñas**: comentarios y calificación (de 1 a 5 estrellas) que
  estudiantes anteriores dejaron tras completar una tutoría con este tutor,
  junto con la fecha. Si no hay reseñas todavía, se indica.
- **Reservar una tutoría**: al final de la página, visible **solo si usted
  inició sesión como estudiante** (vea la sección 7). Si no es estudiante
  (por ejemplo, si es tutor o administrador), se muestra en su lugar un
  aviso de que solo los estudiantes pueden reservar.

Un enlace **"Volver a la búsqueda"** en la parte superior regresa a
`/tutores`.

![Perfil de un tutor](capturas/09-perfil-tutor.png)

---

## 7. Cómo reservar una clase

La reserva se realiza directamente desde el perfil del tutor
(`/tutores/:id`), en la sección **"Reservar una tutoría"**, y solo está
disponible para usuarios con rol de estudiante. Si el tutor no tiene ningún
curso publicado, esta sección no aparece.

Pasos:

1. **Curso**: elija cuál de los cursos del tutor desea reservar.
2. **Modalidad**: elija entre las modalidades que ese curso específico
   ofrece (Virtual, En casa del tutor, o A domicilio del estudiante).
3. **Duración**: 60, 90 o 120 minutos.
4. **Fecha**: elija un día igual o posterior al día actual.
5. **Hora**:
   - Si la modalidad es **Virtual**, puede elegir cualquier hora libremente.
   - Si la modalidad es **presencial** (en casa del tutor o a domicilio del
     estudiante), la hora se limita a los bloques que el tutor marcó como
     disponibles ese día de la semana, según la duración elegida. Si el
     tutor no tiene disponibilidad configurada para ese día, se le avisa y
     no podrá elegir una hora para esa fecha.
6. **Repetir semanalmente** (opcional): puede elegir que la misma reserva se
   repita automáticamente 2, 3, 4, 6, 8 o 12 semanas seguidas a la misma
   hora, en vez de reservar "No repetir" (una sola sesión). Internamente
   esto crea una reserva individual por cada semana — no es una
   recurrencia que pueda editarse o cancelarse como un solo bloque después.
7. Mientras completa el formulario, se muestra un **desglose de precio**:
   el monto de la tutoría según duración y tarifa base, el costo de
   traslado si aplica (calculado según la distancia entre las direcciones
   del tutor y del estudiante, solo para la modalidad "a domicilio del
   estudiante"), y el total — multiplicado por el número de semanas si
   eligió repetir.
8. Presione **Confirmar reserva**.

Si la reserva se crea correctamente, se muestra un mensaje de confirmación
con un botón **"Ver mis reservas"** que lo lleva a `/mis-reservas`. Si el
horario elegido ya choca con otra reserva suya o del tutor, el sistema
rechaza la solicitud y muestra el motivo.

![Formulario de reserva en el perfil del tutor](capturas/10-reserva.png)

---

## 8. Mis reservas

Esta es la vista del **estudiante** en `/mis-reservas`, accesible desde
**"Mis reservas"** en el encabezado (solo visible para estudiantes
autenticados).

Muestra todas sus tutorías reservadas — pasadas y futuras — como una lista
de tarjetas, cada una con:

- Título del curso y nombre del tutor ("con [nombre del tutor]").
- Estado de la reserva: **Pendiente**, **Confirmada**, **Completada** o
  **Cancelada**, cada uno con un color distintivo.
- Fecha y hora de la sesión.
- Modalidad (con su ícono correspondiente).
- Precio total.

Si una reserva está en estado **Pendiente** o **Confirmada**, aparece un
botón **Cancelar**. Al cancelarla, su estado cambia a "Cancelada" y deja de
contar para efectos de disponibilidad; esta acción no puede deshacerse
desde la interfaz.

Si todavía no tiene ninguna reserva, se muestra un estado vacío con un
botón directo **"Buscar tutores"** que lo lleva a `/tutores`.

![Mis reservas — vista del estudiante](capturas/11-mis-reservas.png)

---

## 9. Panel del tutor

El panel del tutor se organiza en cuatro pantallas, todas accesibles solo
para usuarios con rol de tutor, y enlazadas entre sí desde el panel
principal.

### 9.1 Panel principal (`/tutor/dashboard`)

Accesible desde **"Mi panel"** en el encabezado. Muestra un saludo con su
nombre y una insignia de estado de aprobación:

- **"Cuenta aprobada"** (si un administrador ya validó su perfil): su
  perfil es visible en las búsquedas de los estudiantes.
- **"Pendiente de aprobación"**: aún no aparece en las búsquedas, pero
  puede preparar sus cursos y horarios mientras espera la revisión.

Desde aquí se accede, mediante tres tarjetas, a:

- **Mis cursos** (`/tutor/cursos`).
- **Disponibilidad** (`/tutor/disponibilidad`).
- **Reservas recibidas** (`/tutor/reservas`).

![Panel principal del tutor](capturas/12-tutor-dashboard.png)

### 9.2 Mis cursos (`/tutor/cursos`)

Lista de todos sus cursos publicados, en una tabla con título, categoría,
modalidades y tarifa por hora.

- **Nuevo curso**: abre un formulario (ventana modal) donde indica título,
  descripción, categoría, una o más modalidades (Virtual, En mi casa, A
  domicilio del estudiante — debe elegir al menos una), tarifa base por
  hora y, opcionalmente, tarifa adicional por kilómetro (solo aplica a la
  modalidad "a domicilio del estudiante"; déjela en 0 si no ofrece esa
  modalidad o no desea cobrar traslado).
- **Editar**: abre el mismo formulario con los datos actuales del curso
  precargados.
- **Desactivar**: tras confirmar, el curso deja de aparecer en el buscador
  de tutores y los estudiantes ya no pueden reservarlo. Esta acción no
  puede revertirse desde la interfaz.

Si todavía no tiene cursos, se le recuerda que necesita crear al menos uno
para aparecer en el buscador de tutores.

![Gestión de cursos del tutor](capturas/13-tutor-cursos.png)

### 9.3 Disponibilidad (`/tutor/disponibilidad`)

Una cuadrícula semanal (días de la semana en columnas, horas en filas)
donde marca los bloques de hora en que está disponible para tutorías
**presenciales** (la modalidad virtual no depende de esta cuadrícula).

- Para marcar o desmarcar celdas, haga clic y arrastre el mouse sobre la
  cuadrícula (puede "pintar" varias celdas seguidas).
- Si prefiere no usar el mouse, puede navegar con la tecla Tab y presionar
  Espacio o Enter sobre la celda deseada.
- Los cambios no se guardan automáticamente: el botón **"Guardar
  disponibilidad"** se habilita solo cuando hay cambios pendientes, y debe
  presionarlo para que se reflejen en el sistema de reservas.

Esta cuadrícula es la que consulta el formulario de reserva del estudiante
(sección 7) para ofrecer únicamente horas realmente disponibles en
modalidad presencial.

![Cuadrícula de disponibilidad semanal](capturas/14-tutor-disponibilidad.png)

### 9.4 Reservas recibidas (`/tutor/reservas`)

Lista, con el mismo formato de tarjetas que "Mis reservas" del estudiante,
todas las tutorías que le agendaron, identificando en cada una al
estudiante correspondiente ("Estudiante: [nombre]").

Desde aquí puede:

- **Cancelar** una reserva en estado Pendiente o Confirmada.
- **Marcar completada** una reserva en estado Confirmada, una vez que la
  sesión ya se llevó a cabo. Marcar una reserva como completada es lo que
  habilita al estudiante a dejarle una reseña.

![Reservas recibidas por el tutor](capturas/15-tutor-reservas.png)

---

## 10. Chat en tiempo real

El chat (`/chat`) está disponible para cualquier usuario autenticado desde
el enlace **"Mensajes"** del encabezado, y permite conversar en tiempo real
con otros usuarios con los que ya tiene una conversación iniciada.

La pantalla se divide en dos paneles:

- **Bandeja de entrada** (columna izquierda): lista de conversaciones
  existentes, cada una mostrando foto/iniciales y nombre de la otra
  persona. Al seleccionar una conversación, se abre su historial en el
  panel derecho. En pantallas angostas (móvil), este panel ocupa toda la
  pantalla hasta que se elige una conversación, y un botón de flecha
  permite volver a la bandeja.
- **Conversación** (columna derecha): el historial de mensajes de la
  conversación activa, con un indicador "Conectando…" mientras se
  restablece la conexión en tiempo real si fuera necesario. Puede
  desplazarse hacia arriba para cargar mensajes más antiguos.

Para enviar un mensaje, escriba en el campo de texto en la parte inferior
de la conversación y envíelo; el campo de envío se deshabilita mientras la
conexión en tiempo real no esté activa, para evitar mensajes que no
lleguen a destino.

Si no hay ninguna conversación seleccionada, se muestra un mensaje
indicando que debe elegir una de la bandeja de entrada.

> Nota: al momento de este manual, la bandeja de entrada solo muestra
> conversaciones que ya tienen al menos un mensaje previo. No existe
> todavía, en ninguna otra pantalla de la aplicación (por ejemplo el
> perfil de un tutor), un botón directo para iniciar una conversación
> nueva con alguien con quien nunca ha chateado — el chat se usa para dar
> seguimiento a conversaciones ya existentes.

![Bandeja de entrada y conversación del chat](capturas/16-chat.png)

---

## 11. Reportes y denuncias

EducaSpot cuenta con políticas de convivencia (consulte `/politicas`, sección
"Sistema de reportes") que establecen que cualquier usuario puede reportar a
otro especificando un motivo (inasistencia, conducta, cobros indebidos u
otro) y que la administración revisa cada caso en un plazo de 5 días
hábiles. Los reportes resueltos y su seguimiento pueden consultarse por el
lado del administrador en el panel de moderación (vea la sección 12.3).

> Nota importante: al momento de este manual, la aplicación **todavía no
> ofrece un formulario o botón dentro de la interfaz** (por ejemplo, en el
> perfil de un tutor o en una reserva) para que un estudiante o tutor
> presente una denuncia por su cuenta. Mientras esa función no esté
> disponible en pantalla, si necesita reportar una conducta indebida,
> una inasistencia o un cobro irregular, comuníquese directamente con
> soporte (vea la sección 14) describiendo el caso, para que la
> administración le dé seguimiento por ese medio.

Lo que sí puede hacer cualquier usuario desde la aplicación es leer el
detalle completo de qué se considera una conducta prohibida y cuáles son
las consecuencias (incluida la suspensión de cuenta) en la página de
políticas de convivencia, enlazada también desde el pie de página de todo
el sitio y desde la pantalla de suspensión.

![Sección de reportes en las políticas de convivencia](capturas/17-politicas-reportes.png)

---

## 12. Panel de administración

El panel de administración vive bajo `/admin` y solo es accesible para
usuarios con rol de **Administrador**, enlazado desde **"Administración"**
en el encabezado. Tiene una barra lateral con seis secciones.

### 12.1 Dashboard (`/admin`)

Página de aterrizaje del panel, con un resumen de indicadores generales
obtenidos en tiempo real del backend: usuarios totales, tutores pendientes
de aprobar, denuncias abiertas, apelaciones pendientes, cursos activos y
reservas del último mes.

![Dashboard del panel de administración](capturas/18-admin-dashboard.png)

### 12.2 Categorías (`/admin/categorias`)

Gestión completa (crear, editar, eliminar) de las categorías académicas
que estudiantes y tutores usan en el onboarding, en la búsqueda y al
publicar cursos.

- **Nueva categoría**: pide nombre y un "slug" (identificador corto y
  legible en la URL, por ejemplo `ingles` para "Inglés"); el slug se genera
  automáticamente a partir del nombre pero puede ajustarse a mano.
- **Editar**: modifica nombre y/o slug de una categoría existente.
- **Eliminar**: tras confirmar, borra la categoría de forma permanente.

![Gestión de categorías](capturas/19-admin-categorias.png)

### 12.3 Moderación (`/admin/moderacion`)

Esta sección tiene dos pestañas:

- **Denuncias**: tabla de todas las denuncias registradas en el sistema
  (denunciante, denunciado, motivo y estado), con un filtro por estado
  (Abierta, En revisión, Resuelta, Descartada). Para cada denuncia abierta,
  el administrador puede marcarla como "En revisión", "Resuelta" o
  "Descartada", agregando opcionalmente una nota de resolución que
  describe la decisión tomada.
- **Apelaciones**: tabla de las apelaciones presentadas por usuarios
  suspendidos (vea la sección 13), con su mensaje y estado (Pendiente,
  Aceptada, Rechazada). Para cada apelación pendiente, el administrador
  puede **Aceptar** (lo que reactiva de inmediato la cuenta del usuario) o
  **Rechazar** (la cuenta permanece suspendida), en ambos casos con una
  respuesta opcional dirigida al usuario.

![Panel de moderación — denuncias y apelaciones](capturas/20-admin-moderacion.png)

### 12.4 Analytics (`/admin/analytics`)

Tres gráficas de solo lectura, generadas con los datos reales de la
plataforma:

- **Top 5 tutores por calificación**: gráfica de barras horizontales con
  el promedio de calificación y número de reseñas de los tutores mejor
  evaluados.
- **Demanda por categoría**: gráfica de dona con las horas reservadas por
  categoría académica (agrupando las categorías menos solicitadas bajo
  "Otras categorías" cuando hay más de cinco).
- **Reservas del último mes, por estado**: gráfica de líneas con el conteo
  de reservas de los últimos 30 días según su estado actual (pendientes,
  confirmadas, completadas, canceladas).

Cada gráfica incluye, debajo, un enlace **"Ver datos en tabla"** para
consultar las mismas cifras en formato de tabla simple.

![Analítica de la plataforma](capturas/21-admin-analytics.png)

### 12.5 Tutores (`/admin/tutores`)

Lista de solicitudes de tutor **pendientes de aprobación** — es decir,
cuentas de tutor que ya completaron el onboarding pero todavía no pueden
aparecer en las búsquedas de los estudiantes. Para cada solicitud se
muestra foto/iniciales, nombre, correo y fecha de registro, con dos
acciones:

- **Aprobar**: el tutor pasa a estado aprobado de inmediato y comienza a
  aparecer en las búsquedas.
- **Rechazar**: requiere indicar un motivo; al confirmar, la cuenta del
  tutor queda suspendida (puede apelar esa suspensión igual que cualquier
  otra, vea la sección 13).

![Aprobación de tutores pendientes](capturas/22-admin-tutores.png)

### 12.6 Usuarios (`/admin/usuarios`)

Listado paginado de todas las cuentas registradas en la plataforma, con
filtros por rol (Estudiante, Tutor, Administrador) y por estado (Activo,
Suspendido).

- **Suspender**: requiere indicar un motivo obligatorio; la cuenta no
  podrá iniciar sesión normalmente hasta que se reactive o se resuelva una
  apelación (sección 13). Un administrador no puede suspender su propia
  cuenta — esa opción aparece deshabilitada sobre su propia fila.
- **Reactivar**: devuelve de inmediato el acceso a una cuenta suspendida.

![Gestión de usuarios](capturas/23-admin-usuarios.png)

---

## 13. Suspensión de cuenta

Si su cuenta fue suspendida por un administrador (ya sea por una denuncia,
por el rechazo de una solicitud de tutor, o por cualquier otro motivo),
al iniciar sesión se le redirige automáticamente a `/suspension`, y no
podrá acceder a ninguna otra parte de la plataforma mientras la suspensión
siga vigente (con la única excepción de poder consultar sus datos de
sesión, cerrar sesión y presentar una apelación).

Esta pantalla le muestra:

- El **motivo** de la suspensión, tal como lo registró el administrador.
- La **fecha** en que se aplicó el bloqueo.
- Un formulario para **apelar la suspensión**: escriba una explicación de
  su caso y presione **"Enviar apelación"**.

Una vez enviada la apelación, se le confirma su recepción y se le indica
que la administración la revisará en un plazo de 5 días hábiles (vea la
sección 12.3 para cómo el administrador resuelve estas apelaciones). Puede
también leer las políticas de convivencia completas desde el enlace en
esta misma pantalla, o cerrar sesión si lo desea.

![Pantalla de cuenta suspendida](capturas/24-suspension.png)

---

## 14. Soporte y contacto

Para cualquier duda, problema técnico, o para reportar una situación que
todavía no tiene un formulario dedicado en la aplicación (vea la sección
11), el canal de contacto disponible en toda la plataforma es el correo
electrónico de soporte, enlazado desde **"Soporte"** en el pie de página de
cualquier pantalla:

**soporte@educaspot.gt**

Además del correo de soporte, el pie de página enlaza permanentemente a la
página de **Políticas de convivencia** (`/politicas`), donde se detallan
las reglas de uso de la plataforma: respeto mutuo, conductas prohibidas,
política de cancelaciones e inasistencias, el sistema de reportes, el
proceso de suspensión y apelación, la relación de EducaSpot con los pagos
entre estudiante y tutor (que se realizan directamente entre ambas partes;
la plataforma no los procesa), y el tratamiento de datos personales.

![Pie de página con el enlace de soporte](capturas/25-soporte.png)
