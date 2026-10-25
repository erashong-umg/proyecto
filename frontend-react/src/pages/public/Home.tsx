import { Link } from 'react-router-dom';
import { MapPin, CalendarCheck, MessageCircle, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import styles from './Home.module.scss';

interface Teacher {
  name: string;
  subject: string;
  line: string;
  photo: string;
  rating: string;
}

// Personas de ejemplo de la demo (las mismas del seed). Las fotos viven en public/tutores.
const TEACHERS: Teacher[] = [
  { name: 'María López', subject: 'Inglés y desarrollo web', line: 'Ocho años enseñando inglés conversacional a profesionales.', photo: '/tutores/maria-lopez.png', rating: '4.8' },
  { name: 'Juan Pérez', subject: 'Natación y crossfit', line: 'Entrenador certificado: técnica de nado y resistencia.', photo: '/tutores/juan-perez.png', rating: '4.5' },
  { name: 'Laura Sandoval', subject: 'Matemática', line: 'Cálculo y álgebra explicados paso a paso, sin prisa.', photo: '/tutores/laura-sandoval.png', rating: '4.9' },
  { name: 'Diego Morales', subject: 'Programación', line: 'Aprenda Python con proyectos pequeños y prácticos.', photo: '/tutores/diego-morales.png', rating: '4.6' },
  { name: 'Patricia Fuentes', subject: 'Asesoría de tesis', line: 'Acompaña a estudiantes de posgrado desde la idea hasta la defensa.', photo: '/tutores/patricia-fuentes.png', rating: '4.9' },
  { name: 'Ricardo Alvarado', subject: 'Francés y portugués', line: 'Clases conversacionales para viajeros.', photo: '/tutores/ricardo-alvarado.png', rating: '4.4' },
];

const HERO_TEACHERS = [TEACHERS[0], TEACHERS[1], TEACHERS[2]];

export const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const isTutor = user?.role === 'tutor';

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>Aprenda con personas que enseñan cerca de usted</h1>
            <p className={styles.heroSubtitle}>
              Tutores reales de idiomas, deportes, ciencias, tecnología y posgrado, en su casa, en la de ellos o por videollamada.
            </p>
            <div className={styles.heroActions}>
              {isTutor ? (
                <Link to="/tutor/dashboard">
                  <Button size="lg">Ir a mi panel</Button>
                </Link>
              ) : (
                <Link to="/tutores">
                  <Button size="lg">Buscar tutores</Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link to="/register">
                  <Button size="lg" variant="secondary">Crear cuenta gratuita</Button>
                </Link>
              )}
              {isAuthenticated && user && (
                <p className={styles.welcome}>Bienvenido/a, {user.name}.</p>
              )}
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <svg className={styles.heroRoute} viewBox="0 0 360 380" fill="none" preserveAspectRatio="none">
              <path d="M70 60 C 200 20, 300 120, 290 190 S 120 300, 90 330" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeDasharray="1 9" strokeLinecap="round" />
            </svg>
            {HERO_TEACHERS.map((t, i) => (
              <figure key={t.name} className={`${styles.heroCard} ${styles[`heroCard${i}`]}`}>
                <img src={t.photo} alt="" width={200} height={200} />
                <figcaption>
                  <strong>{t.name}</strong>
                  <span>{t.subject}</span>
                  <span className={styles.rating}><Star aria-hidden="true" /> {t.rating}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.people}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Detrás de cada clase hay una persona</h2>
          <p className={styles.sectionLead}>
            Conozca a quienes enseñan en EducaSpot. Cada tutor es revisado antes de aparecer y usted decide con quién aprender.
          </p>
          <ul className={styles.peopleGrid}>
            {TEACHERS.map((t) => (
              <li key={t.name} className={styles.person}>
                <img src={t.photo} alt={`Retrato de ${t.name}`} width={200} height={200} loading="lazy" />
                <div>
                  <h3>{t.name}</h3>
                  <p className={styles.personSubject}>{t.subject} · <Star aria-hidden="true" /> {t.rating}</p>
                  <p>{t.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.journey}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Su ruta en EducaSpot</h2>
          <ol className={styles.route}>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><MapPin aria-hidden="true" /></span>
              <h3>Encuentre a su tutor</h3>
              <p>Vea quién enseña cerca de usted, con la distancia y el costo del traslado si va a su domicilio.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><CalendarCheck aria-hidden="true" /></span>
              <h3>Reserve sin conflictos</h3>
              <p>Elija una hora libre del tutor; nunca se cruzan dos clases en su agenda ni en la de él.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><MessageCircle aria-hidden="true" /></span>
              <h3>Converse con su tutor</h3>
              <p>Pregunte lo que necesite por chat, antes y durante la clase.</p>
            </li>
            <li className={styles.stop}>
              <span className={styles.stopMarker}><Star aria-hidden="true" /></span>
              <h3>Cuente cómo le fue</h3>
              <p>Su calificación ayuda a otros estudiantes y reconoce a los buenos tutores.</p>
            </li>
          </ol>
        </div>
      </section>

      {!isAuthenticated && (
        <section className={styles.invite}>
          <div className={`container ${styles.inviteInner}`}>
            <div>
              <h2>¿Sabe enseñar algo?</h2>
              <p>Ofrezca sus clases, ponga sus horarios y reciba estudiantes de su zona.</p>
            </div>
            <Link to="/register">
              <Button size="lg" variant="secondary">Quiero ser tutor</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
