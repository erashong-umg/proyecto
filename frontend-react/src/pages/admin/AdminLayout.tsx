import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Tags, Users, ShieldAlert, BarChart3, GraduationCap, Palette, ShieldCheck, LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../services/formatters';
import styles from './AdminLayout.module.scss';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/moderacion', label: 'Moderación', icon: ShieldAlert },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/tutores', label: 'Tutores', icon: GraduationCap },
  { to: '/admin/apariencia', label: 'Apariencia', icon: Palette },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ClipboardList },
];

// Título del header según la sub-sección activa. Se busca por el prefijo de
// ruta más largo para que subrutas (p.ej. /admin/usuarios/123) hereden el
// título de su sección padre.
const SECTION_TITLES: Record<string, string> = {
  '/admin': 'Panel de administración',
  '/admin/categorias': 'Categorías',
  '/admin/usuarios': 'Usuarios',
  '/admin/moderacion': 'Moderación',
  '/admin/analytics': 'Analítica',
  '/admin/tutores': 'Aprobación de tutores',
  '/admin/apariencia': 'Apariencia',
  '/admin/auditoria': 'Registro de auditoría',
};

const getActiveTitle = (pathname: string): string => {
  const match = Object.keys(SECTION_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return SECTION_TITLES[match ?? '/admin'];
};

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const title = getActiveTitle(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          <ShieldCheck aria-hidden="true" /> EducaSpot — Administración
        </span>
        <div className={styles.account}>
          {user && (
            <>
              <span className={styles.avatar}>{getInitials(user.name)}</span>
              <span className={styles.accountName}>{user.name}</span>
            </>
          )}
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Navegación de administración">
          <nav className={styles.nav}>
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          <header className={styles.header}>
            <h1>{title}</h1>
          </header>
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
