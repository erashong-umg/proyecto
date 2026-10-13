import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.scss';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = ({ label, error, hint, className = '', id, ...rest }: TextareaProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={styles.field}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <textarea
        id={inputId}
        className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
      {error && <span id={errorId} className={styles.errorMsg}>{error}</span>}
      {!error && hint && <span id={hintId} className={styles.hint}>{hint}</span>}
    </div>
  );
};
