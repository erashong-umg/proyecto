// Presencia en memoria: cuántos sockets tiene conectados cada usuario (puede tener
// varias pestañas). Vale para una sola instancia del servidor; con varias habría
// que mover esto a Redis (adapter de socket.io).
const conexiones = new Map<string, number>();

export const isOnline = (userId: string): boolean => (conexiones.get(userId) ?? 0) > 0;

// Devuelve true si es la primera conexión del usuario (pasó de offline a online).
export const addConnection = (userId: string): boolean => {
  const total = (conexiones.get(userId) ?? 0) + 1;
  conexiones.set(userId, total);
  return total === 1;
};

// Devuelve true si era la última conexión del usuario (pasó de online a offline).
export const removeConnection = (userId: string): boolean => {
  const total = (conexiones.get(userId) ?? 0) - 1;
  if (total > 0) {
    conexiones.set(userId, total);
    return false;
  }
  conexiones.delete(userId);
  return true;
};

export const userRoom = (userId: string): string => `user:${userId}`;
export const presenceRoom = (userId: string): string => `presence:${userId}`;
