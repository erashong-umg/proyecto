import styles from './Policies.module.scss';

const SECTIONS = [
  { id: 'respeto', label: '1. Respeto mutuo' },
  { id: 'conductas', label: '2. Conductas prohibidas' },
  { id: 'cancelaciones', label: '3. Cancelaciones' },
  { id: 'reportes', label: '4. Sistema de reportes' },
  { id: 'suspension', label: '5. Suspensión y apelación' },
  { id: 'pagos', label: '6. Pagos y reembolsos' },
  { id: 'privacidad', label: '7. Privacidad' },
];

export const PoliciesPage = () => {
  return (
    <div className={`${styles.page} container`}>
      <nav className={styles.toc} aria-label="Contenido de la página">
        <p className={styles.tocTitle}>En esta página</p>
        <ul>
          {SECTIONS.map((s) => (
            <li key={s.id}><a href={`#${s.id}`}>{s.label}</a></li>
          ))}
        </ul>
      </nav>

      <div className={styles.content}>
        <h1>Políticas de convivencia de EducaSpot</h1>
        <p><em>Última actualización: octubre 2026</em></p>

        <h2 id="respeto">1. Compromiso de respeto mutuo</h2>
        <p>Todos los usuarios de EducaSpot — estudiantes, tutores y administradores — se comprometen a mantener un trato respetuoso, profesional y libre de discriminación de cualquier tipo (género, etnia, religión, orientación sexual, etc.).</p>

        <h2 id="conductas">2. Conductas prohibidas</h2>
        <ul>
          <li>Lenguaje ofensivo, acosador o amenazante.</li>
          <li>Solicitar servicios fuera de la plataforma (para evitar el sistema de pagos y reseñas).</li>
          <li>Suplantación de identidad.</li>
          <li>Conducta inapropiada durante una sesión (virtual o presencial).</li>
        </ul>

        <h2 id="cancelaciones">3. Cancelaciones e inasistencias</h2>
        <p>Si debe cancelar una tutoría, hágalo con al menos 24 horas de anticipación. Tres inasistencias injustificadas pueden resultar en suspensión temporal de su cuenta.</p>

        <h2 id="reportes">4. Sistema de reportes</h2>
        <p>Cualquier usuario puede reportar a otro especificando motivo (inasistencia, conducta, cobros indebidos) y adjuntando evidencia. La administración revisa cada caso en un plazo de 5 días hábiles.</p>

        <h2 id="suspension">5. Suspensión y apelación</h2>
        <p>Si su cuenta es suspendida, podrá ingresar únicamente a la vista de Suspensión donde encontrará el motivo, la fecha del bloqueo y un formulario para apelar. Su cuenta permanecerá suspendida hasta que la administración resuelva su apelación.</p>

        <h2 id="pagos">6. Pagos y reembolsos</h2>
        <p>Los pagos se realizan directamente entre estudiante y tutor, preferentemente por transferencia o billetera electrónica. EducaSpot no procesa pagos, pero facilita el sistema de reseñas para garantizar la calidad.</p>

        <h2 id="privacidad">7. Privacidad</h2>
        <p>Sus datos personales (correo, teléfono, dirección) solo se comparten con usuarios involucrados en una reserva confirmada. No vendemos ni compartimos información con terceros.</p>
      </div>
    </div>
  );
};
