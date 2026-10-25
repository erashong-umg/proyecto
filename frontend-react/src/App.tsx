import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './router';
import { VersionBadge } from './components/layout/VersionBadge';
import { UpdateBanner } from './components/layout/UpdateBanner';
import { GuidedTour } from './components/tour/GuidedTour';

function App() {
  // Zustand no necesita un Provider — solo disparamos la verificación de
  // sesión (token en localStorage) una vez al montar la app.
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <>
      <AppRouter />
      <GuidedTour />
      <VersionBadge />
      <UpdateBanner />
    </>
  );
}

export default App;
