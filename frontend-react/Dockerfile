# Multi-stage build: compila el SPA con pnpm y lo sirve con nginx
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Client ID público de Google (inicio de sesión); vacío = sin botón de Google
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
# Versión visible en el badge flotante (los pasa el workflow de deploy; ver vite.config.ts)
ARG APP_VERSION=
ARG APP_BRANCH=
ARG APP_COMMIT=
ARG APP_BUILT_AT=
ENV VITE_APP_VERSION=$APP_VERSION \
    VITE_APP_BRANCH=$APP_BRANCH \
    VITE_APP_COMMIT=$APP_COMMIT \
    VITE_APP_BUILT_AT=$APP_BUILT_AT
RUN pnpm run build

# --- Runtime stage ---
FROM nginx:1.31-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
