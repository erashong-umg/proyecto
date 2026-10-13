import { io, type Socket } from 'socket.io-client';
import { TOKEN_KEY } from './api';

// Sin VITE_API_URL: api.ts usa baseURL '/api' relativo (mismo origen, vía el
// proxy de Vite en dev y same-origin en prod) — seguimos ese mismo patrón acá
// en vez de hardcodear un host, así dev y prod funcionan sin cambios.
const SOCKET_URL = import.meta.env.VITE_API_URL ?? undefined;

// Singleton: toda la app (chat, notificaciones, etc.) comparte una única
// conexión de Socket.io en vez de abrir un socket nuevo por componente.
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem(TOKEN_KEY) },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
