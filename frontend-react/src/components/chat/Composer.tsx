import { useState, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './Composer.module.scss';

interface ComposerProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  isSending?: boolean;
}

// No se usa el componente Textarea genérico (components/ui) acá: ese
// componente envuelve el campo en su propio bloque con margen propio pensado
// para formularios verticales, y este composer necesita una fila
// input+botón sin ese espaciado — se replican los mismos tokens de diseño
// (radio, color, borde) directo sobre un <textarea> propio.
export const Composer = ({ onSend, disabled = false, isSending = false }: ComposerProps) => {
  const [value, setValue] = useState('');

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    setValue('');
    try {
      await onSend(trimmed);
    } catch {
      // Si el envío falla devolvemos el texto al campo para no perder el borrador.
      setValue(trimmed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => { event.preventDefault(); void handleSend(); }}
    >
      <label htmlFor="chat-composer-input" className="sr-only">Mensaje</label>
      <textarea
        id="chat-composer-input"
        className={styles.textarea}
        rows={1}
        placeholder="Escriba un mensaje…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button
        type="submit"
        size="md"
        isLoading={isSending}
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensaje"
      >
        <SendHorizontal aria-hidden="true" />
      </Button>
    </form>
  );
};
