# Despliegue a producción (GitHub Actions + Podman + nginx)

Resumen: cada push a `main` hace que GitHub Actions construya las imágenes
de `backend-express` y `frontend-react`, las publique en GitHub Container
Registry (GHCR) y luego se conecte por SSH al servidor solo para bajar las
imágenes nuevas y reiniciar los contenedores. El servidor nunca compila
nada — solo corre `podman-compose pull && up -d`.

Arquitectura: un solo dominio (`yettotools.com`) sirve el frontend en `/`;
nginx (en el host, fuera de los contenedores) enruta `/api` y `/socket.io`
al contenedor del backend. Mismo origen entre frontend y backend → no hace
falta CORS cruzado ni tocar código. MongoDB, backend y frontend corren como
contenedores Podman atados a `127.0.0.1` (no expuestos a internet
directamente); nginx + certbot manejan TLS.

Todos los pasos de esta guía (excepto los de la sección "Secrets de
GitHub") se ejecutan **en el servidor**, por SSH, una sola vez. Los pasos
posteriores a cada push a `main` los hace el workflow automáticamente.

## 1. DNS

Crear en tu proveedor de DNS dos registros `A` apuntando a la IP pública
del servidor:

```
yettotools.com      A    <IP-del-servidor>
www.yettotools.com  A    <IP-del-servidor>
```

Espera a que propaguen antes del paso de certbot (`dig yettotools.com` debe
devolver la IP correcta).

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

Copiar `deploy/compose.yml` y `deploy/.env.example` del repo a ese
directorio del servidor (por `scp`, `rsync`, o pegando el contenido a
mano). Luego:

```bash
cp .env.example .env
nano .env   # completar GHCR_OWNER, DOMAIN, MONGO_ROOT_PASSWORD, JWT_SECRET
            # con valores reales — JWT_SECRET distinto al de desarrollo,
            # mínimo 32 caracteres (ej: openssl rand -hex 32)
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

## 3. nginx + HTTPS (host, fuera de los contenedores)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Copiar `deploy/nginx-yettotools.conf` del repo a
`/etc/nginx/sites-available/yettotools.com`, luego:

```bash
sudo ln -s /etc/nginx/sites-available/yettotools.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Certbot reescribe el server block para agregar HTTPS + redirect 80→443
sudo certbot --nginx -d yettotools.com -d www.yettotools.com

# Abrir el firewall si usas ufw
sudo ufw allow 'Nginx Full'
```

Certbot instala un renovador automático (systemd timer); no hace falta
tocarlo de nuevo salvo que cambie el dominio.

## 4. Secrets de GitHub

En el repo → **Settings → Secrets and variables → Actions → New repository
secret**, crear:

| Secret            | Valor                                                              |
|--------------------|---------------------------------------------------------------------|
| `SSH_HOST`         | IP o hostname del servidor                                         |
| `SSH_USER`         | usuario SSH que ya tiene acceso (y permiso para correr `podman`)    |
| `SSH_PRIVATE_KEY`  | llave privada SSH cuya pública ya está en `~/.ssh/authorized_keys` del servidor para `SSH_USER` |
| `SSH_PORT`         | opcional — solo si el SSH del servidor no usa el puerto 22          |

`GITHUB_TOKEN` (usado para publicar en GHCR) es automático, no hay que
crearlo.

## 5. Uso diario

A partir de aquí, cada push/merge a `main` dispara
`.github/workflows/deploy.yml`:

1. Construye y publica `ghcr.io/erashong-umg/proyecto-backend` y
   `...-frontend` (tags `latest` y el SHA del commit).
2. Se conecta por SSH y corre `podman-compose pull && up -d` en
   `~/apps/educaspot`.

Para desplegar manualmente sin esperar un push, conectarse por SSH y
repetir los comandos de "Primer arranque manual" arriba.

## Troubleshooting

- **`podman-compose pull` falla con 401/403**: la sesión de `podman login
  ghcr.io` expiró o el PAT no tiene `read:packages` — repetir el login.
- **Logs de un contenedor**: `podman logs -f educaspot_backend_1` (el
  nombre exacto sale de `podman ps`).
- **Rollback rápido**: `podman-compose down && podman pull
  ghcr.io/erashong-umg/proyecto-backend:<sha-anterior> && ...` o simplemente
  revertir el commit en `main` y dejar que el workflow vuelva a desplegar.
- **CORS raro / 404 en `/api`**: confirmar que `DOMAIN` en `.env` coincide
  con el dominio real y que `nginx -t` no tiene errores tras copiar
  `nginx-yettotools.conf`.
