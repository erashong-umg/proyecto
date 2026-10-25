import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import { User } from '../models/User';
import { Category } from '../models/Category';
import { Course, type Modality } from '../models/Course';
import { Availability } from '../models/Availability';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { env } from '../config/env';

const seed = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Seed] Conectado a', env.MONGODB_URI);

  console.log('[Seed] Limpiando colecciones existentes...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Course.deleteMany({}),
    Availability.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  console.log('[Seed] Creando categorías...');
  const cats = await Category.insertMany([
    { name: 'Idiomas', slug: 'idiomas' },
    { name: 'Deportes', slug: 'deportes' },
    { name: 'Ciencias', slug: 'ciencias' },
    { name: 'Tecnología', slug: 'tecnologia' },
    { name: 'Posgrado', slug: 'posgrado' },
  ]);

  console.log('[Seed] Creando admin...');
  await User.create({
    email: 'admin@educaspot.gt',
    password: 'Admin123!',
    name: 'Administrador',
    role: 'admin',
    status: 'active',
    onboardingCompleted: true,
  });

  console.log('[Seed] Creando tutores aprobados...');
  const tutor1 = await User.create({
    email: 'maria@educaspot.gt',
    password: 'Tutor123!',
    name: 'María López',
    role: 'tutor',
    status: 'active',
    onboardingCompleted: true,
    idDocument: { type: 'dpi', number: '2456712340101' },
    phone: '+502 5555-1001',
    address: { street: 'Zona 10, Guatemala', coords: { lat: 14.5905, lng: -90.5155 } },
    photoUrl: '/tutores/maria-lopez.png',
    categoryIds: [cats[0]._id, cats[3]._id],
    tutorData: {
      bio: 'Profesora bilingüe con 8 años de experiencia enseñando inglés conversacional y desarrollo web.',
      cvUrl: 'https://linkedin.com/in/maria-lopez',
      portfolioUrl: 'https://maria.dev',
      baseRate: 120,
      ratePerKm: 5,
      categories: [cats[0]._id, cats[3]._id],
      avgRating: 4.8,
      reviewCount: 12,
      approved: true,
    },
  });

  const tutor2 = await User.create({
    email: 'juan@educaspot.gt',
    password: 'Tutor123!',
    name: 'Juan Pérez',
    role: 'tutor',
    status: 'active',
    onboardingCompleted: true,
    idDocument: { type: 'dpi', number: '1987654320101' },
    phone: '+502 5555-1002',
    address: { street: 'Zona 14, Guatemala', coords: { lat: 14.5845, lng: -90.5155 } },
    photoUrl: '/tutores/juan-perez.png',
    categoryIds: [cats[1]._id],
    tutorData: {
      bio: 'Entrenador personal certificado, especializado en natación y crossfit.',
      cvUrl: 'https://linkedin.com/in/juan-perez',
      baseRate: 150,
      ratePerKm: 8,
      categories: [cats[1]._id],
      avgRating: 4.5,
      reviewCount: 8,
      approved: true,
    },
  });

  await User.create({
    email: 'carlos@educaspot.gt',
    password: 'Tutor123!',
    name: 'Carlos Mendoza',
    role: 'tutor',
    status: 'active',
    onboardingCompleted: true,
    idDocument: { type: 'dpi', number: '3012456780101' },
    address: { street: 'Mixco', coords: { lat: 14.6333, lng: -90.6067 } },
    photoUrl: '/tutores/carlos-mendoza.png',
    categoryIds: [cats[2]._id],
    tutorData: {
      bio: 'Doctor en Física, ofrece tutorías universitarias de cálculo y álgebra.',
      cvUrl: 'https://linkedin.com/in/carlos-mendoza',
      baseRate: 200,
      ratePerKm: 10,
      categories: [cats[2]._id],
      approved: false,        // pendiente de aprobación
    },
  });

  console.log('[Seed] Creando estudiantes...');
  const student1 = await User.create({
    email: 'ana@educaspot.gt',
    password: 'Est123!',
    name: 'Ana Ramírez',
    role: 'student',
    status: 'active',
    onboardingCompleted: true,
    idDocument: { type: 'dpi', number: '2234567890301' },
    phone: '+502 5555-2001',
    address: { street: 'Zona 1, Guatemala', coords: { lat: 14.6349, lng: -90.5069 } },
    categoryIds: [cats[0]._id],
  });

  await User.create({
    email: 'luis@educaspot.gt',
    password: 'Est123!',
    name: 'Luis García',
    role: 'student',
    status: 'active',
    onboardingCompleted: true,
    idDocument: { type: 'dpi', number: '2765432100101' },
    address: { street: 'Zona 7, Guatemala', coords: { lat: 14.6400, lng: -90.5500 } },
    categoryIds: [cats[3]._id],
  });

  console.log('[Seed] Creando disponibilidades...');
  await Availability.insertMany([
    {
      tutorId: tutor1._id,
      slots: [
        { dayOfWeek: 1, startMinute: 540, endMinute: 1080 },         // Lunes 9-18
        { dayOfWeek: 3, startMinute: 540, endMinute: 1080 },         // Miércoles 9-18
        { dayOfWeek: 5, startMinute: 840, endMinute: 1200 },         // Viernes 14-20
      ],
    },
    {
      tutorId: tutor2._id,
      slots: [
        { dayOfWeek: 2, startMinute: 360, endMinute: 720 },          // Martes 6-12
        { dayOfWeek: 4, startMinute: 360, endMinute: 720 },          // Jueves 6-12
        { dayOfWeek: 6, startMinute: 480, endMinute: 1020 },         // Sábado 8-17
      ],
    },
  ]);

  console.log('[Seed] Creando cursos...');
  await Course.insertMany([
    {
      tutorId: tutor1._id,
      categoryId: cats[0]._id,
      title: 'Inglés conversacional para profesionales',
      description: 'Clases dinámicas enfocadas en conversación fluida en contextos laborales.',
      modalities: ['virtual', 'presencial-estudiante'],
      baseRate: 120,
      ratePerKm: 5,
    },
    {
      tutorId: tutor1._id,
      categoryId: cats[3]._id,
      title: 'Introducción a JavaScript y React',
      description: 'Curso introductorio para personas sin experiencia previa.',
      modalities: ['virtual'],
      baseRate: 150,
      ratePerKm: 0,
    },
    {
      tutorId: tutor2._id,
      categoryId: cats[1]._id,
      title: 'Natación para adultos',
      description: 'Técnica de nado y resistencia cardiovascular.',
      modalities: ['presencial-tutor', 'presencial-estudiante'],
      baseRate: 150,
      ratePerKm: 8,
    },
  ]);

  console.log('[Seed] Creando más tutores y cursos de ejemplo...');
  // Cada tutor aprobado trae un curso. Las fotos viven en frontend-react/public/tutores;
  // los que tienen `photo: ''` se muestran con sus iniciales hasta tener su retrato.
  const demoTutors = [
    {
      key: 'laura', name: 'Laura Sandoval', photo: '/tutores/laura-sandoval.png', cat: 2, dpi: '2345098760101', phone: '+502 5555-1004',
      street: 'Zona 11, Guatemala', coords: { lat: 14.6000, lng: -90.5400 }, baseRate: 130, ratePerKm: 6, avgRating: 4.9, reviewCount: 21,
      bio: 'Licenciada en Matemática con 15 años de experiencia preparando estudiantes de bachillerato y primer año universitario.',
      course: { title: 'Cálculo y álgebra para primer año de universidad', description: 'Refuerzo de límites, derivadas y álgebra con ejercicios resueltos paso a paso.', modalities: ['virtual', 'presencial-tutor', 'presencial-estudiante'] },
    },
    {
      key: 'diego', name: 'Diego Morales', photo: '/tutores/diego-morales.png', cat: 3, dpi: '2890123450101', phone: '+502 5555-1005',
      street: 'Zona 4, Guatemala', coords: { lat: 14.6220, lng: -90.5160 }, baseRate: 110, ratePerKm: 4, avgRating: 4.6, reviewCount: 14,
      bio: 'Desarrollador de software que enseña programación desde cero con proyectos pequeños y prácticos.',
      course: { title: 'Programación con Python desde cero', description: 'Variables, funciones y un primer proyecto real, sin experiencia previa.', modalities: ['virtual', 'presencial-estudiante'] },
    },
    {
      key: 'patricia', name: 'Patricia Fuentes', photo: '/tutores/patricia-fuentes.png', cat: 4, dpi: '2567890120101', phone: '+502 5555-1006',
      street: 'Zona 15, Guatemala', coords: { lat: 14.6050, lng: -90.4900 }, baseRate: 220, ratePerKm: 8, avgRating: 4.9, reviewCount: 9,
      bio: 'Maestra en Investigación Educativa. Acompaña a estudiantes de posgrado en el diseño y la redacción de su tesis.',
      course: { title: 'Asesoría de tesis y metodología de investigación', description: 'Planteamiento del problema, marco teórico, método y revisión de avances.', modalities: ['virtual', 'presencial-estudiante'] },
    },
    {
      key: 'ricardo', name: 'Ricardo Alvarado', photo: '/tutores/ricardo-alvarado.png', cat: 0, dpi: '1764532980101', phone: '+502 5555-1007',
      street: 'Zona 9, Guatemala', coords: { lat: 14.6040, lng: -90.5110 }, baseRate: 100, ratePerKm: 5, avgRating: 4.4, reviewCount: 6,
      bio: 'Profesor de francés y portugués con residencia en Francia y Brasil. Clases conversacionales para viajeros.',
      course: { title: 'Francés para viajeros', description: 'Frases y vocabulario útiles para viajar, con práctica de pronunciación.', modalities: ['virtual', 'presencial-tutor'] },
    },
    {
      key: 'daniela', name: 'Daniela Cifuentes', photo: '', cat: 1, dpi: '2678901230101', phone: '+502 5555-1008',
      street: 'Zona 16, Guatemala', coords: { lat: 14.6040, lng: -90.4700 }, baseRate: 90, ratePerKm: 6, avgRating: 4.7, reviewCount: 17,
      bio: 'Instructora certificada de yoga y movilidad. Sesiones suaves para principiantes y para quienes pasan el día sentados.',
      course: { title: 'Yoga y movilidad para principiantes', description: 'Respiración, posturas básicas y estiramientos para el día a día.', modalities: ['virtual', 'presencial-tutor', 'presencial-estudiante'] },
    },
    {
      key: 'andres', name: 'Andrés Castillo', photo: '', cat: 2, dpi: '2101234560101', phone: '+502 5555-1009',
      street: 'Villa Nueva', coords: { lat: 14.5270, lng: -90.5880 }, baseRate: 95, ratePerKm: 5, avgRating: 4.2, reviewCount: 5,
      bio: 'Químico biólogo con experiencia en laboratorio. Explica química y biología con ejemplos de la vida diaria.',
      course: { title: 'Química y biología para bachillerato', description: 'Repaso por temas con práctica para exámenes de fin de ciclo.', modalities: ['virtual', 'presencial-estudiante'] },
    },
    {
      key: 'sofia', name: 'Sofía Barrios', photo: '', cat: 0, dpi: '2890765430101', phone: '+502 5555-1010',
      street: 'Zona 10, Guatemala', coords: { lat: 14.5960, lng: -90.5050 }, baseRate: 140, ratePerKm: 5, avgRating: 4.8, reviewCount: 11,
      bio: 'Tutora de inglés académico, con experiencia preparando el TOEFL y exámenes de ingreso a universidades en el extranjero.',
      course: { title: 'Preparación TOEFL e inglés académico', description: 'Estrategias por sección, simulacros cronometrados y retroalimentación.', modalities: ['virtual'] },
    },
  ];

  const demoAvailabilitySlots = [
    { dayOfWeek: 1, startMinute: 480, endMinute: 1020 },
    { dayOfWeek: 2, startMinute: 480, endMinute: 1020 },
    { dayOfWeek: 4, startMinute: 600, endMinute: 1140 },
    { dayOfWeek: 6, startMinute: 540, endMinute: 780 },
  ];

  for (const t of demoTutors) {
    const tutor = await User.create({
      email: `${t.key}@educaspot.gt`,
      password: 'Tutor123!',
      name: t.name,
      role: 'tutor',
      status: 'active',
      onboardingCompleted: true,
      idDocument: { type: 'dpi', number: t.dpi },
      phone: t.phone,
      address: { street: t.street, coords: t.coords },
      photoUrl: t.photo,
      categoryIds: [cats[t.cat]._id],
      tutorData: {
        bio: t.bio,
        cvUrl: `https://linkedin.com/in/${t.key}-educaspot`,
        baseRate: t.baseRate,
        ratePerKm: t.ratePerKm,
        categories: [cats[t.cat]._id],
        avgRating: t.avgRating,
        reviewCount: t.reviewCount,
        approved: true,
      },
    });
    await Availability.create({ tutorId: tutor._id, slots: demoAvailabilitySlots });
    await Course.create({
      tutorId: tutor._id,
      categoryId: cats[t.cat]._id,
      ...t.course,
      modalities: t.course.modalities as Modality[],
      baseRate: t.baseRate,
      ratePerKm: t.ratePerKm,
    });
  }

  console.log('[Seed] Creando booking completado de prueba...');
  const course = await Course.findOne({ tutorId: tutor1._id });
  if (course) {
    const pastStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);  // hace 14 días
    const pastEnd = new Date(pastStart.getTime() + 60 * 60 * 1000);
    const booking = await Booking.create({
      studentId: student1._id,
      tutorId: tutor1._id,
      courseId: course._id,
      startsAt: pastStart,
      endsAt: pastEnd,
      durationMin: 60,
      modality: 'virtual',
      status: 'completed',
      priceBreakdown: { baseAmount: 120, transportAmount: 0, total: 120 },
    });
    await Review.create({
      tutorId: tutor1._id,
      studentId: student1._id,
      bookingId: booking._id,
      rating: 5,
      comment: 'Excelente profesora, muy paciente. Recomendada 100%.',
    });
  }

  console.log('[Seed] Listo.');
  console.log('\n=== CREDENCIALES DE DEMO ===');
  console.log('admin@educaspot.gt / Admin123!');
  console.log('maria@educaspot.gt / Tutor123!  (TUTOR APROBADO - inglés y JS)');
  console.log('juan@educaspot.gt / Tutor123!   (TUTOR APROBADO - natación)');
  console.log('carlos@educaspot.gt / Tutor123! (TUTOR PENDIENTE DE APROBACIÓN)');
  console.log('laura, diego, patricia, ricardo, daniela, andres, sofia @educaspot.gt / Tutor123! (tutores aprobados, un curso cada uno)');
  console.log('ana@educaspot.gt / Est123!     (estudiante)');
  console.log('luis@educaspot.gt / Est123!     (estudiante)');
  console.log('==============================\n');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
