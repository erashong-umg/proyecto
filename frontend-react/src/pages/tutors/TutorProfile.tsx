import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, Video, Home, MapPinned } from 'lucide-react';
import { useTutorProfile } from '../../hooks/useTutorProfile';
import { useAuth } from '../../hooks/useAuth';
import { BookingWizard } from '../../components/tutors/BookingWizard';
import { formatQ, formatShortDate, getInitials } from '../../services/formatters';
import styles from './TutorProfile.module.scss';

const MODALITY_LABELS: Record<string, string> = {
  virtual: 'Virtual',
  'presencial-tutor': 'En casa del tutor',
  'presencial-estudiante': 'A domicilio del estudiante',
};

const MODALITY_ICONS: Record<string, typeof Video> = {
  virtual: Video,
  'presencial-tutor': Home,
  'presencial-estudiante': MapPinned,
};

export const TutorProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isLoading, error } = useTutorProfile(id);

  if (isLoading) return <p className={styles.status}>Cargando perfil…</p>;
  if (error || !data) return <p className={styles.status}>{error ?? 'No se pudo cargar el perfil.'}</p>;

  const { tutor, courses, reviews } = data;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link to="/tutores" className={styles.back}><ArrowLeft aria-hidden="true" /> Volver a la búsqueda</Link>

        <div className={styles.header}>
          {tutor.photoUrl ? (
            <img src={tutor.photoUrl} alt="" className={styles.photo} />
          ) : (
            <span className={styles.avatar}>{getInitials(tutor.name)}</span>
          )}
          <div>
            <h1>{tutor.name}</h1>
            <div className={styles.rating}>
              <Star aria-hidden="true" className={styles.starIcon} />
              <span>{tutor.tutorData.avgRating > 0 ? tutor.tutorData.avgRating.toFixed(1) : 'Sin calificaciones aún'}</span>
              {tutor.tutorData.reviewCount > 0 && <span>({tutor.tutorData.reviewCount} reseñas)</span>}
            </div>
            <p className={styles.rate}>{formatQ(tutor.tutorData.baseRate)} <small>/ hora base</small></p>
          </div>
        </div>

        <section className={styles.section}>
          <h2>Acerca de</h2>
          <p className={styles.bio}>{tutor.tutorData.bio}</p>
        </section>

        <section className={styles.section}>
          <h2>Cursos ofrecidos</h2>
          {courses.length === 0 ? (
            <p className={styles.empty}>Este tutor todavía no publicó cursos.</p>
          ) : (
            <div className={styles.courses}>
              {courses.map((c) => (
                <div key={c._id} className={styles.courseCard}>
                  <div className={styles.courseHead}>
                    <h3>{c.title}</h3>
                    <span className={styles.courseCategory}>{c.categoryId.name}</span>
                  </div>
                  <p>{c.description}</p>
                  <div className={styles.modalities}>
                    {c.modalities.map((m) => {
                      const Icon = MODALITY_ICONS[m];
                      return (
                        <span key={m} className={styles.modality}>
                          <Icon aria-hidden="true" /> {MODALITY_LABELS[m]}
                        </span>
                      );
                    })}
                  </div>
                  <p className={styles.coursePrice}>{formatQ(c.baseRate)} <small>/ hora</small></p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Reseñas</h2>
          {reviews.length === 0 ? (
            <p className={styles.empty}>Todavía no tiene reseñas.</p>
          ) : (
            <div className={styles.reviews}>
              {reviews.map((r) => (
                <div key={r._id} className={styles.review}>
                  <div className={styles.reviewHead}>
                    <strong>{r.studentId.name}</strong>
                    <span className={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} aria-hidden="true" className={i < r.rating ? styles.starFilled : styles.starEmpty} />
                      ))}
                    </span>
                    <span className={styles.reviewDate}>{formatShortDate(r.createdAt)}</span>
                  </div>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {user?.role === 'student' ? (
          <section className={styles.section}>
            <BookingWizard tutor={tutor} courses={courses} />
          </section>
        ) : (
          <p className={styles.bookingNote}>Solo los estudiantes pueden reservar tutorías.</p>
        )}
      </div>
    </div>
  );
};
