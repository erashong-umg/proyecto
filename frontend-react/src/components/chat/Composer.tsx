import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './Composer.module.scss';

interface ComposerProps {
  onSend: (content: string) => void;
  // Avisa si el usuario está escribiendo (para el "escribiendo…" del otro lado).
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

// No se usa el componente Textarea genérico (components/ui) acá: ese
// componente envuelve el campo en su propio bloque con margen propio pensado
// para formularios verticales, y este composer necesita una fila
// input+botón sin ese espaciado — se replican los mismos tokens de diseño
// (radio, color, borde) directo sobre un <textarea> propio.
export const Composer = ({ onSend, onTyping, disabled = false }: ComposerProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // El campo crece con el texto (hasta el max-height del CSS), como en WhatsApp.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    onTyping?.(false);
    // El mensaje aparece de inmediato en la conversación; si falla, queda
    // marcado ahí con opción de reintentar.
    onSend(trimmed);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => { event.preventDefault(); handleSend(); }}
    >
      <label htmlFor="chat-composer-input" className="sr-only">Mensaje</label>
      <textarea
        id="chat-composer-input"
        ref={textareaRef}
        className={styles.textarea}
        rows={1}
        placeholder="Escriba un mensaje…"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onTyping?.(event.target.value.trim().length > 0);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button
        type="submit"
        size="md"
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensaje"
      >
        <SendHorizontal aria-hidden="true" />
      </Button>
    </form>
  );
};
