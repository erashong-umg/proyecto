import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './router';
import { VersionBadge } from './components/layout/VersionBadge';

function App() {
  // Zustand no necesita un Provider — solo disparamos la verificación de
  // sesión (token en localStorage) una vez al montar la app.
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <>
      <AppRouter />
      <VersionBadge />
    </>
  );
}

export default App;
