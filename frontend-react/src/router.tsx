import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/public/Home';
import { LoginPage } from './pages/public/Login';
import { RegisterPage } from './pages/public/Register';
import { PoliciesPage } from './pages/public/Policies';
import { OnboardingPage } from './pages/onboarding/Onboarding';
import { SuspensionPage } from './pages/suspension/Suspension';
import { TutorSearchPage } from './pages/tutors/TutorSearch';
import { TutorProfilePage } from './pages/tutors/TutorProfile';
import { MyBookingsPage } from './pages/bookings/MyBookings';
import { TutorDashboardPage } from './pages/tutor/Dashboard';
import { TutorCoursesPage } from './pages/tutor/Courses';
import { TutorAvailabilityPage } from './pages/tutor/Availability';
import { TutorBookingsPage } from './pages/tutor/Bookings';
import { NotFoundPage } from './pages/NotFound';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLogin';
import { AdminDashboardPage } from './pages/admin/Dashboard';
import { AdminCategoriesPage } from './pages/admin/Categories';
import { AdminUsersPage } from './pages/admin/Users';
import { AdminModerationPage } from './pages/admin/Moderation';
import { AdminAnalyticsPage } from './pages/admin/Analytics';
import { AdminTutorsPage } from './pages/admin/Tutors';
import { AdminAppearancePage } from './pages/admin/Appearance';
import { AdminAuditLogPage } from './pages/admin/AuditLog';
import { ChatPage } from './pages/chat/ChatPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PublicShell } from './components/layout/PublicShell';
import { useAuth } from './hooks/useAuth';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useApplyCustomTheme } from './hooks/useApplyCustomTheme';

export const AppRouter = () => {
  const { isLoading } = useAuth();
  useSocketConnection();
  useApplyCustomTheme();

  if (isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando…</div>;
  }

  return (
    <Routes>
      {/* Panel de administración — independiente del sitio público: login
          propio (/admin/login) y sin Header/Footer de estudiante/tutor. Ver
          CLAUDE.md "panel de administración independiente". */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']} loginPath="/admin/login">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="categorias" element={<AdminCategoriesPage />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
        <Route path="moderacion" element={<AdminModerationPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="tutores" element={<AdminTutorsPage />} />
        <Route path="apariencia" element={<AdminAppearancePage />} />
        <Route path="auditoria" element={<AdminAuditLogPage />} />
      </Route>

      {/* Sitio público (estudiante/tutor): Header + Footer compartidos */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/politicas" element={<PoliciesPage />} />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        {/* Vista única de suspensión */}
        <Route path="/suspension" element={
          <ProtectedRoute>
            <SuspensionPage />
          </ProtectedRoute>
        } />

        {/* Búsqueda y perfil de tutores */}
        <Route path="/tutores" element={
          <ProtectedRoute allowedRoles={['student']}>
            <TutorSearchPage />
          </ProtectedRoute>
        } />
        <Route path="/tutores/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <TutorProfilePage />
          </ProtectedRoute>
        } />

        {/* Reservas del estudiante */}
        <Route path="/mis-reservas" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyBookingsPage />
          </ProtectedRoute>
        } />

        {/* Área del tutor */}
        <Route path="/tutor/dashboard" element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/tutor/cursos" element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorCoursesPage />
          </ProtectedRoute>
        } />
        <Route path="/tutor/disponibilidad" element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorAvailabilityPage />
          </ProtectedRoute>
        } />
        <Route path="/tutor/reservas" element={
          <ProtectedRoute allowedRoles={['tutor']}>
            <TutorBookingsPage />
          </ProtectedRoute>
        } />

        {/* Chat en tiempo real */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
