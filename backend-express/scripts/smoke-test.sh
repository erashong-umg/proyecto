#!/usr/bin/env bash
# Smoke test rápido que verifica que el servidor está vivo y responde correctamente.
# Uso: ./scripts/smoke-test.sh [host] [port]

set -e
HOST="${1:-localhost}"
PORT="${2:-4000}"
BASE="http://${HOST}:${PORT}"

echo "[Smoke] Probando ${BASE}..."

# 1. Health check
HEALTH=$(curl -sf "${BASE}/api/health")
echo "[Smoke] /api/health → ${HEALTH}"

echo "${HEALTH}" | grep -q '"status":"ok"' || { echo "FAIL: health check no devolvió ok"; exit 1; }

# 2. Endpoint público (categorías debe devolver [])
echo "[Smoke] /api/categories →"
curl -sf "${BASE}/api/categories" | head -c 200
echo

# 3. Endpoint protegido sin token → 401
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/api/auth/me")
[ "${STATUS}" = "401" ] || { echo "FAIL: /api/auth/me sin token devolvió ${STATUS}, esperaba 401"; exit 1; }
echo "[Smoke] /api/auth/me sin token → 401 (correcto)"

echo "[Smoke] Todos los checks pasaron ✓"
