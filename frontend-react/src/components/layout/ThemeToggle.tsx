import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import styles from './ThemeToggle.module.scss';

export const ThemeToggle = () => {
  const { theme, toggle } = useThemeStore();
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemPrefersDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = theme ? theme === 'dark' : systemPrefersDark;

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema oscuro' : 'Tema claro'}
    >
      {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
};
