import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  /** A dónde mandar a un visitante sin sesión — /admin/* usa /admin/login, el resto /login (ver CLAUDE.md "panel de administración independiente"). */
  loginPath?: string;
}

export const ProtectedRoute = ({ children, allowedRoles, loginPath = '/login' }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  // Sin la excepción de pathname, un usuario suspendido que visita /suspension
  // (también envuelta en ProtectedRoute) quedaría atrapado en un Navigate hacia
  // sí misma en vez de renderizar la página real.
  if (isAuthenticated && user?.status === 'suspended' && location.pathname !== '/suspension') {
    return <Navigate to="/suspension" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
