import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';

/**
 * Conecta el socket singleton mientras haya sesión activa y lo desconecta al
 * desmontar o al cerrar sesión. Montar una sola vez (p.ej. en el layout raíz
 * autenticado), no por cada componente que consuma el chat.
 */
export const useSocketConnection = (): void => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);

  useEffect(() => {
    if (!isAuthenticated) return;

    connect();
    return () => disconnect();
  }, [isAuthenticated, connect, disconnect]);
};
