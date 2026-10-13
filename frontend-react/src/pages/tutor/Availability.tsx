import { useEffect } from 'react';
import { DAYS, HOURS, useMyAvailability } from '../../hooks';
import { Button } from '../../components/ui/Button';
import { dayOfWeekLabel, minuteToHHMM } from '../../services/formatters';
import styles from './Availability.module.scss';

export const TutorAvailabilityPage = () => {
  const {
    isLoading, isSaving, error, success, hasChanges,
    isSelected, toggleCell, beginPaint, paintCell, endPaint, save,
  } = useMyAvailability();

  // Suelta el "pincel" aunque el mouse se levante fuera de la cuadrícula.
  useEffect(() => {
    window.addEventListener('mouseup', endPaint);
    return () => window.removeEventListener('mouseup', endPaint);
  }, [endPaint]);

  const handleKeyDown = (e: React.KeyboardEvent, day: number, hour: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleCell(day, hour);
    }
  };

  return (
    <div className={`${styles.page} container`}>
      <h1>Mi disponibilidad</h1>
      <p className={styles.help}>
        Haga clic y arrastre sobre las celdas (o navegue con Tab y presione Espacio) para
        marcar los bloques de hora en que está disponible para tutorías presenciales.
      </p>

      {error && <p className={styles.errorMsg}>{error}</p>}
      {success && <p className={styles.successMsg}>Disponibilidad guardada.</p>}

      {isLoading ? (
        <p className={styles.status}>Cargando…</p>
      ) : (
        <>
          <div className={styles.gridWrap}>
            <div className={styles.grid} role="grid" aria-label="Cuadrícula de disponibilidad semanal">
              <div className={styles.row} role="row">
                <div className={`${styles.cell} ${styles.corner}`} role="presentation" />
                {DAYS.map((d) => (
                  <div key={d} className={`${styles.cell} ${styles.dayHeader}`} role="columnheader">
                    {dayOfWeekLabel(d).slice(0, 3)}
                  </div>
                ))}
              </div>

              {HOURS.map((hour) => (
                <div className={styles.row} key={hour} role="row">
                  <div className={`${styles.cell} ${styles.hourCell}`} role="rowheader">
                    {minuteToHHMM(hour * 60)}
                  </div>
                  {DAYS.map((day) => {
                    const selected = isSelected(day, hour);
                    return (
                      <button
                        key={`${day}_${hour}`}
                        type="button"
                        role="gridcell"
                        aria-pressed={selected}
                        aria-label={`${dayOfWeekLabel(day)} ${minuteToHHMM(hour * 60)}`}
                        className={`${styles.cell} ${styles.slot} ${selected ? styles.selected : ''}`}
                        onMouseDown={() => beginPaint(day, hour)}
                        onMouseEnter={() => paintCell(day, hour)}
                        onKeyDown={(e) => handleKeyDown(e, day, hour)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={save} isLoading={isSaving} disabled={!hasChanges} className={styles.saveBtn}>
            Guardar disponibilidad
          </Button>
        </>
      )}
    </div>
  );
};
