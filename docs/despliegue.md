# Despliegue a producción (GitHub Actions + Podman + nginx)

Resumen: cada push a `main` hace que GitHub Actions construya las imágenes
de `backend-express` y `frontend-react`, las publique en GitHub Container
Registry (GHCR) y luego se conecte por SSH al servidor solo para bajar las
imágenes nuevas y reiniciar los contenedores. El servidor nunca compila
nada — solo corre `podman-compose pull && up -d`.

Arquitectura: un solo dominio (`educaspot.yettotools.com`, un subdominio
propio — `yettotools.com` raíz ya está en uso por otro servicio en este
mismo servidor) sirve el frontend en `/`; nginx (en el host, fuera de los
contenedores) enruta `/api` y `/socket.io` al contenedor del backend. Mismo
origen entre frontend y backend → no hace falta CORS cruzado ni tocar
código. MongoDB, backend y frontend corren como contenedores Podman atados
a `127.0.0.1` (no expuestos a internet directamente); nginx + certbot
manejan TLS.

Todos los pasos de esta guía (excepto los de la sección "Secrets de
GitHub") se ejecutan **en el servidor**, por SSH, una sola vez. Los pasos
posteriores a cada push a `main` los hace el workflow automáticamente.

## 1. DNS

Crear en tu proveedor de DNS un registro `A` apuntando al subdominio del
proyecto (NO al dominio raíz, que ya está en uso) hacia la IP pública del
servidor:

```
educaspot.yettotools.com  A    <IP-del-servidor>
```

Espera a que propague antes del paso de certbot (`dig
educaspot.yettotools.com` debe devolver la IP correcta).

## 2. Preparar el servidor

Conectado por SSH al servidor:

```bash
# Confirmar que Podman y podman-compose (o "podman compose") están disponibles
podman --version
podman-compose --version   # o: podman compose version

# Crear el directorio de despliegue (debe coincidir con DEPLOY_PATH
# en .github/workflows/deploy.yml — por defecto ~/apps/educaspot)
mkdir -p ~/apps/educaspot
cd ~/apps/educaspot
```

Copiar `deploy/compose.yml` del repo a ese directorio del servidor (por
`scp`, `rsync`, o pegando el contenido a mano) solo para el primer arranque
manual: a partir de ahí **cada deploy lo vuelve a escribir** desde la rama que se
despliega (dejando el anterior como `compose.yml.bak`), así que el del repo es la
fuente de verdad y no conviene editarlo a mano en el servidor. El workflow
(`.github/workflows/deploy.yml`) también escribe `.env` automáticamente en cada
deploy a partir de los secrets del ambiente `DEPLOY_PRD` (ver sección 4),
así que no hace falta crearlo a mano — salvo para el "Primer arranque
manual" de abajo, antes del primer push a `main`:

```bash
cp .env.example .env
nano .env   # completar GHCR_OWNER, DOMAIN, MONGO_ROOT_PASSWORD, JWT_SECRET
            # con valores reales — JWT_SECRET distinto al de desarrollo,
            # mínimo 32 caracteres (ej: openssl rand -hex 32)
            # Estos deben coincidir con los secrets que cargues en GitHub,
            # porque el próximo deploy sobrescribe este archivo.
```

### Autenticar Podman contra GHCR

Los paquetes de GHCR se crean como **privados** por defecto en el primer
push. Para que el servidor pueda hacer `pull`, autenticar una sola vez con
un Personal Access Token de GitHub (classic, scope `read:packages`):

```bash
podman login ghcr.io -u <tu-usuario-de-github>
# pegar el PAT cuando pida la contraseña
```

Esto persiste la sesión en `~/.config/containers/auth.json` (rootless), no
hace falta repetirlo en cada deploy.

### Primer arranque manual (antes de depender del CI)

```bash
cd ~/apps/educaspot
podman-compose pull
podman-compose up -d
podman ps   # confirmar que mongodb, backend y frontend están "Up"
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:8080/
```

### Arranque automático tras reboot del host

Podman rootless no tiene un daemon persistente tipo `dockerd` — sin este
paso, un reinicio del servidor (mantenimiento del proveedor, OOM del host,
etc.) deja los contenedores apagados para siempre, aunque `restart: always`
esté puesto en `compose.yml` y el lingering del usuario esté habilitado.
Habilitar una sola vez:

```bash
systemctl --user enable --now podman-restart.service
```

Ese servicio corre `podman start --all --filter restart-policy=always` en
cada boot — **solo** recoge contenedores con política `always`, no
`unless-stopped` (por eso `deploy/compose.yml` usa `always`, no lo cambies).
Verificar que quedó habilitado:

```bash
systemctl --user is-enabled podman-restart.service   # debe decir "enabled"
loginctl show-user $(whoami) | grep Linger            # debe decir "yes"
```

## 3. nginx + HTTPS (host, fuera de los contenedores)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Copiar `deploy/nginx-educaspot.conf` del repo a
`/etc/nginx/sites-available/educaspot.yettotools.com`, luego:

```bash
sudo ln -s /etc/nginx/sites-available/educaspot.yettotools.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Certbot reescribe el server block para agregar HTTPS + redirect 80→443
sudo certbot --nginx -d educaspot.yettotools.com

# Abrir el firewall si usas ufw
sudo ufw allow 'Nginx Full'
```

Certbot instala un renovador automático (systemd timer); no hace falta
tocarlo de nuevo salvo que cambie el dominio.

## 4. Secrets de GitHub

En el repo → **Settings → Secrets and variables → Actions**, ambiente
`DEPLOY_PRD` → **Add environment secret**, crear:

| Secret                 | Valor                                                              |
|------------------------|---------------------------------------------------------------------|
| `SSH_HOST`             | IP o hostname del servidor                                         |
| `SSH_USER`             | usuario SSH que ya tiene acceso (y permiso para correr `podman`)    |
| `SSH_PRIVATE_KEY`      | llave privada SSH cuya pública ya está en `~/.ssh/authorized_keys` del servidor para `SSH_USER` |
| `SSH_PORT`             | opcional — solo si el SSH del servidor no usa el puerto 22          |
| `GHCR_OWNER`           | `erashong-umg` (dueño de los paquetes en GHCR)                     |
| `DOMAIN`               | `educaspot.yettotools.com`                                          |
| `MONGO_ROOT_USERNAME`  | usuario root de Mongo en producción                                |
| `MONGO_ROOT_PASSWORD`  | contraseña fuerte, distinta a la de desarrollo                     |
| `JWT_SECRET`           | secreto aleatorio ≥32 caracteres, distinto al de desarrollo (ej: `openssl rand -hex 32`) |

Estos últimos cinco son los mismos campos de `deploy/.env.example` — el
workflow los escribe como `.env` en el servidor en cada deploy (ver paso
"Desplegar en el servidor vía SSH" en `deploy.yml`), así que son la fuente
de verdad real; cambiar `deploy/.env.example` o el `.env` del servidor a
mano ya no tiene efecto después del siguiente push a `main`.

`GITHUB_TOKEN` (usado para publicar en GHCR) es automático, no hay que
crearlo.

### Secret `GOOGLE_CLIENT_ID` (inicio de sesión con Google)

Se crea igual que los demás: como *environment secret* de `DEPLOY_PRD`
(Settings → Environments → DEPLOY_PRD → *Add environment secret*). El job de
build del frontend declara ese mismo entorno en `deploy.yml`, así que también
lo ve. (El Client ID en realidad es público, porque queda dentro del JavaScript
del frontend; se guarda como secret solo por comodidad.)

El workflow lo usa en dos lugares: como argumento de build del frontend
(`VITE_GOOGLE_CLIENT_ID`, se compila dentro del SPA) y escrito en el `.env` del
servidor para el backend. Si no está definido, el botón de Google simplemente no
aparece y `POST /api/auth/google` responde 503. Cómo obtener el Client ID:
sección 7.

## 5. Uso diario

> Cómo llega un cambio a producción (siempre `local` → `feature/*` → `develop` → `release` →
> `main`, con un PR por tramo, y tags): ver [flujo-de-ramas.md](flujo-de-ramas.md).

A partir de aquí, cada push/merge a `main` dispara
`.github/workflows/deploy.yml`:

1. Construye y publica `ghcr.io/erashong-umg/proyecto-backend` y
   `...-frontend` (tags `latest` y el SHA del commit).
2. Se conecta por SSH y, en `~/apps/educaspot`, sincroniza `compose.yml` y `.env`,
   corre `podman-compose pull`,
   elimina los contenedores `educaspot_backend_1` y `educaspot_frontend_1` y
   corre `podman-compose up -d`. Los elimina a propósito: `podman-compose up -d`
   no recrea un contenedor ya existente aunque haya una imagen nueva ni aplica
   un `.env` distinto (solo lo vuelve a arrancar), y el servidor se quedaba con
   el código anterior. Mongo no se toca; sus datos están en el volumen.
3. Verifica que el backend (`:4000/api/health`) y el frontend (`:8080`)
   respondan; si no, el job falla y muestra el log del backend.

### Desplegar una rama a mano (lista de ramas)

El mismo workflow se puede lanzar manualmente eligiendo la rama: en GitHub →
**Actions → Deploy → Run workflow**, abrir la lista **Rama a desplegar**
(`main`, `release` o `develop`) y pulsar **Run workflow**. Construye esa rama y
la despliega con el mismo proceso. Útil para probar `release` en el servidor
antes de integrarla en `main`.

- El título de cada ejecución indica qué rama se desplegó, y las imágenes se
  etiquetan con el commit realmente construido.
- El servidor siempre corre la imagen `latest`: lo último que se despliegue
  (sea cual sea la rama) es lo que queda en producción. Para volver a `main`,
  vuelva a lanzar el workflow con `main`.
- Solo corre un despliegue a la vez; si se lanza otro, espera su turno.
- Para ofrecer otras ramas en la lista, agréguelas en `options` del input
  `branch` de `deploy.yml`.

También se puede desplegar sin GitHub, conectándose por SSH y repitiendo los
comandos de "Primer arranque manual" arriba.

### Versión visible: qué hay desplegado

Como hay un solo servidor y se puede desplegar cualquier rama, cada compilación
queda identificada y la versión se ve en dos lugares:

- **Badge flotante** (esquina inferior izquierda de todas las páginas): muestra
  la versión y, si no es `main`, la rama. El punto indica la rama (verde `main`,
  ámbar `release`, azul `develop`, gris otra/local). Al pulsarlo se abre el
  detalle del **frontend** y del **backend** (versión, rama, commit y fecha de
  compilación) y avisa si los dos están en commits distintos, señal de un
  despliegue incompleto.
- **`GET /api/version`** (pública) y `GET /api/health`: devuelven `version`,
  `branch`, `commit` y `builtAt` del backend. Útil desde `curl` o el navegador:
  `https://<DOMAIN>/api/version`.

La **versión** se calcula al compilar, en el workflow, con los tags de git:
`v1.2` si el commit está etiquetado, o el último tag + el commit
(`v1.2+abc1234`) si hay cambios posteriores. Por eso conviene **crear un tag
`vX.Y` por cada versión publicada** (en `main`, tras integrar la release). Se
pasa a las imágenes como `APP_VERSION`, `APP_BRANCH`, `APP_COMMIT` y
`APP_BUILT_AT` (build-args); en desarrollo local el frontend las lee del git y
el backend muestra `dev` / `local`.

## 6. Conectarse a Mongo desde fuera

El puerto 27017 está atado a `127.0.0.1` en el servidor (no expuesto a
internet — ver `deploy/compose.yml`). Para usar Compass/`mongosh`/etc.
desde tu máquina, abre un túnel SSH:

```bash
ssh -L 27017:localhost:27017 deploy@yettotools.com
```

Déjalo abierto y conéctate en tu cliente a:

```
mongodb://admin:<MONGO_ROOT_PASSWORD>/educaspot?authSource=admin
```

(`<MONGO_ROOT_PASSWORD>` es el valor real que está en `.env` en el
servidor — no el placeholder de `.env.example`). El host/puerto locales
(`localhost:27017`) los resuelve el túnel, no hace falta ponerlos en la
cadena de conexión si tu cliente ya asume `localhost:27017` por defecto;
si no, usa `mongodb://admin:<password>@localhost:27017/educaspot?authSource=admin`.

## 7. Inicio de sesión con Google (Google Cloud)

1. En [Google Cloud Console](https://console.cloud.google.com/) cree (o elija)
   un proyecto → **APIs y servicios → Pantalla de consentimiento de OAuth**:
   tipo *Externo*, nombre de la app, correo de soporte. Mientras esté en
   modo *Prueba*, solo pueden ingresar los correos que agregue como
   *usuarios de prueba*; para abrirlo a cualquiera hay que publicarla.
2. **Credenciales → Crear credenciales → ID de cliente de OAuth** → tipo
   *Aplicación web*.
3. **Orígenes de JavaScript autorizados** (sin barra final ni ruta):
   - `http://localhost:5173` (desarrollo)
   - `https://<DOMAIN>` (producción, p. ej. `https://educaspot.yettotools.com`)

   No hace falta URI de redireccionamiento: se usa el botón de Google
   Identity Services, no un redirect.
4. Copie el **ID de cliente** (`xxxx.apps.googleusercontent.com`):
   - Desarrollo: `backend-express/.env` → `GOOGLE_CLIENT_ID=...` y
     `frontend-react/.env.local` → `VITE_GOOGLE_CLIENT_ID=...` (el mismo
     valor en ambos; `.env.local` no se versiona).
   - Producción: secret `GOOGLE_CLIENT_ID` del entorno `DEPLOY_PRD` (ver sección 4).

## Troubleshooting

- **Los contenedores quedaron "Exited" después de un reinicio del
  servidor** (verificar con `podman ps -a` y `journalctl --list-boots` si
  el boot coincide con la hora del "Exited"): falta
  `systemctl --user enable --now podman-restart.service` — ver sección
  "Arranque automático tras reboot del host" arriba. Levantar a mano
  mientras tanto con `podman-compose up -d`.
- **`podman-compose pull` falla con 401/403**: la sesión de `podman login
  ghcr.io` expiró o el PAT no tiene `read:packages` — repetir el login.
- **Logs de un contenedor**: `podman logs -f educaspot_backend_1` (el
  nombre exacto sale de `podman ps`).
- **Rollback rápido**: `podman-compose down && podman pull
  ghcr.io/erashong-umg/proyecto-backend:<sha-anterior> && ...` o simplemente
  revertir el commit en `main` y dejar que el workflow vuelva a desplegar.
- **CORS raro / 404 en `/api`**: confirmar que `DOMAIN` en `.env` coincide
  con el dominio real y que `nginx -t` no tiene errores tras copiar
  `nginx-educaspot.conf`.
- **"conflicting server name" en `nginx -t`**: este servidor aloja varios
  sitios (`yettotools.com` raíz, `auth.yettotools.com`,
  `desktop.yettotools.com`); si aparece ese warning, algún `server_name` se
  repite entre archivos de `sites-enabled/` — revisar con `grep -rl
  <dominio> /etc/nginx/sites-available/` antes de tocar nada ahí.
