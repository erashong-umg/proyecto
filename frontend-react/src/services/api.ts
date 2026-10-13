import axios, { type AxiosError } from 'axios';

// El backend valida JWT vía header Authorization (no cookies) — ver
// backend-express/CLAUDE.md "Auth is Bearer-header-based". El token vive en
// localStorage bajo esta clave; authStore.ts es el único lugar que lo escribe.
export const TOKEN_KEY = 'edumarket_token';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: si el backend devuelve 401, la sesión ya no es
// válida (token vencido, revocado, o nunca existió) — limpiar y redirigir.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Solo redirigir si no estamos ya en /login o /register para evitar loops
      const path = window.location.pathname;
      if (!['/login', '/register'].includes(path)) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Helper para extraer mensaje legible
export const getErrorMessage = (error: unknown, fallback = 'Ha ocurrido un error'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default api;
