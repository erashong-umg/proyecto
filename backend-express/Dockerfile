# Multi-stage build para optimizar el tamaño de la imagen final
FROM node:25-alpine AS builder

WORKDIR /app

# Copiar solo package.json + lock para caching de layers
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# Copiar código fuente y compilar
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:25-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Solo deps de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código compilado (incluye dist/public, ya generado por npm run build)
COPY --from=builder /app/dist ./dist

# winston (src/utils/logger.ts) crea ./logs al arrancar — el usuario no-root
# de abajo necesita permiso de escritura sobre /app, no solo sobre dist/.
RUN mkdir -p logs && chown -R node:node /app

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

EXPOSE 4000

# Usuario no-root (seguridad)
USER node

CMD ["node", "dist/server.js"]
