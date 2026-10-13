import { useAuthStore } from '../store/authStore';

/** Punto de acceso único al estado de sesión (respaldado por Zustand, no Context). */
export const useAuth = () => useAuthStore();
