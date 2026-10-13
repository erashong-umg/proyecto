import { GraduationCap, Presentation } from 'lucide-react';
import styles from '../../pages/public/Auth.module.scss';

interface RoleSelectorProps {
  value: 'student' | 'tutor';
  onChange: (role: 'student' | 'tutor') => void;
}

export const RoleSelector = ({ value, onChange }: RoleSelectorProps) => (
  <div className={styles.roleSelector}>
    <label className={`${styles.roleOption} ${value === 'student' ? styles.selected : ''}`}>
      <input
        type="radio"
        name="role"
        value="student"
        checked={value === 'student'}
        onChange={() => onChange('student')}
      />
      <span><GraduationCap className={styles.roleIcon} aria-hidden="true" /> Estudiante</span>
      <small>Quiero aprender</small>
    </label>
    <label className={`${styles.roleOption} ${value === 'tutor' ? styles.selected : ''}`}>
      <input
        type="radio"
        name="role"
        value="tutor"
        checked={value === 'tutor'}
        onChange={() => onChange('tutor')}
      />
      <span><Presentation className={styles.roleIcon} aria-hidden="true" /> Tutor</span>
      <small>Quiero enseñar</small>
    </label>
  </div>
);
