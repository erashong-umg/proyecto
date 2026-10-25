import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ClipboardList, LayoutDashboard, MessageCircle, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { TourHelpButton } from '../tour/TourHelpButton';
import { getInitials } from '../../services/formatters';
import type { UserRole } from '../../types/user';
import styles from './Header.module.scss';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Estudiante',
  tutor: 'Tutor',
  admin: 'Administrador',
};

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  const navLinks = (
    <>
      {user?.role !== 'tutor' && (
        <NavLink to="/tutores" className={linkClass} onClick={() => setMobileOpen(false)}>
          <Search aria-hidden="true" /> Buscar tutores
        </NavLink>
      )}
      {isAuthenticated && user?.role === 'student' && (
        <NavLink to="/mis-reservas" className={linkClass} onClick={() => setMobileOpen(false)}>
          <ClipboardList aria-hidden="true" /> Mis reservas
        </NavLink>
      )}
      {isAuthenticated && user?.role === 'tutor' && (
        <NavLink to="/tutor/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
          <LayoutDashboard aria-hidden="true" /> Mi panel
        </NavLink>
      )}
      {isAuthenticated && (
        <NavLink to="/chat" className={linkClass} onClick={() => setMobileOpen(false)}>
          <MessageCircle aria-hidden="true" /> Mensajes
        </NavLink>
      )}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={`${styles.inner} container`}>
        <Link to="/" className={styles.brand} onClick={() => setMobileOpen(false)}>
          <svg
            className={styles.brandMark}
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="19" r="3.5" fill="currentColor" />
            <circle cx="20" cy="7" r="3.5" fill="currentColor" />
            <path d="M8.6 16.6 17.4 9.4" stroke="currentColor" strokeWidth="2" strokeDasharray="1 4" strokeLinecap="round" />
          </svg>
          <span className={styles.brandText}>EducaSpot</span>
        </Link>

        <nav className={styles.nav} aria-label="Principal">{navLinks}</nav>

        <div className={styles.actions}>
          <TourHelpButton />
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                type="button"
                className={styles.userTrigger}
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className={styles.avatar}>{getInitials(user.name)}</span>
                <span className={styles.userTriggerName}>{user.name}</span>
                <ChevronDown aria-hidden="true" className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} />
              </button>

              {menuOpen && (
                <div className={styles.menuPanel} role="menu">
                  <p className={styles.menuName}>{user.name}</p>
                  <p className={styles.menuRole}>{ROLE_LABELS[user.role]}</p>
                  <button type="button" className={styles.menuLogout} role="menuitem" onClick={handleLogout}>
                    <LogOut aria-hidden="true" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authActions}>
              <Link to="/login" className={styles.navLink}>Iniciar sesión</Link>
              <Link to="/register">
                <Button size="sm">Crear cuenta</Button>
              </Link>
            </div>
          )}

          {/* En móvil el acceso queda visible en la barra, sin abrir el menú. */}
          {!isAuthenticated && (
            <Link to="/login" className={styles.mobileLogin}>
              <Button variant="secondary" size="sm">Ingresar</Button>
            </Link>
          )}

          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobilePanel}>
          <nav className={styles.mobileNav} aria-label="Principal (móvil)">{navLinks}</nav>
          <div className={styles.mobileDivider} />
          {isAuthenticated && user ? (
            <div className={styles.mobileAccount}>
              <span className={styles.avatar}>{getInitials(user.name)}</span>
              <div>
                <p className={styles.menuName}>{user.name}</p>
                <p className={styles.menuRole}>{ROLE_LABELS[user.role]}</p>
              </div>
              <button type="button" className={styles.menuLogout} onClick={handleLogout}>
                <LogOut aria-hidden="true" /> Cerrar sesión
              </button>
            </div>
          ) : (
            <div className={styles.mobileAuthActions}>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className={styles.mobileFullButton}>Iniciar sesión</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button className={styles.mobileFullButton}>Crear cuenta</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
