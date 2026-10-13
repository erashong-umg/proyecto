import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Shell del sitio público (estudiante/tutor): Header + Footer + lo que haya
 * en la ruta anidada. El panel de administración vive aparte (/admin/*, ver
 * router.tsx) y NUNCA debe renderizar dentro de este shell — si una cuenta
 * de admin ya autenticada llega acá (URL escrita a mano, bookmark viejo,
 * etc.), se la manda de vuelta a /admin en vez de mostrarle el sitio
 * público. Ver CLAUDE.md "panel de administración independiente".
 */
export const PublicShell = () => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
