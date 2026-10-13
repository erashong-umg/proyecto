export interface ApiError {
  statusCode: number;
  error: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface TutorSummary {
  _id: string;
  name: string;
  photoUrl?: string;
  address?: { street: string; coords: { lat: number; lng: number } };
  categoryIds: string[];
  tutorData: {
    bio: string;
    baseRate: number;
    ratePerKm: number;
    categories: string[];
    avgRating: number;
    reviewCount: number;
    approved: boolean;
  };
  distanceKm?: number;
}

export interface TutorProfileCourse {
  _id: string;
  title: string;
  description: string;
  modalities: ('virtual' | 'presencial-tutor' | 'presencial-estudiante')[];
  baseRate: number;
  ratePerKm: number;
  categoryId: { _id: string; name: string; slug: string };
}

export interface TutorProfileReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  studentId: { _id: string; name: string };
}

export interface TutorProfile {
  tutor: TutorSummary & { createdAt?: string };
  courses: TutorProfileCourse[];
  reviews: TutorProfileReview[];
}

export type Modality = 'virtual' | 'presencial-tutor' | 'presencial-estudiante';

export interface Course {
  _id: string;
  title: string;
  description: string;
  categoryId: { _id: string; name: string; slug: string };
  modalities: Modality[];
  baseRate: number;
  ratePerKm: number;
  active: boolean;
}

export interface TimeSlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

export interface Availability {
  tutorId?: string;
  slots: TimeSlot[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface PriceBreakdown {
  baseAmount: number;
  distanceKm?: number;
  transportAmount?: number;
  total: number;
}

export interface Booking {
  _id: string;
  studentId: { _id: string; name: string; photoUrl?: string };
  tutorId: { _id: string; name: string; photoUrl?: string };
  courseId: { _id: string; title: string; baseRate: number };
  startsAt: string;
  endsAt: string;
  durationMin: number;
  modality: Modality;
  status: BookingStatus;
  priceBreakdown: PriceBreakdown;
  recurringGroupId?: string;
}

// --- Moderación (panel de administración) ---

export type ReportReason = 'inasistencia' | 'conducta' | 'cobros' | 'otro';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface Report {
  _id: string;
  reporterId: { _id: string; name: string; email: string };
  targetUserId: { _id: string; name: string; email: string; status: 'active' | 'suspended' };
  reason: ReportReason;
  evidence: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppealStatus = 'pending' | 'accepted' | 'rejected';

export interface Appeal {
  _id: string;
  userId: { _id: string; name: string; email: string; status: 'active' | 'suspended'; suspensionReason?: string };
  message: string;
  status: AppealStatus;
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
}

// --- Analítica (panel de administración) ---

export interface AdminTopTutor {
  _id: string;
  name: string;
  photoUrl?: string;
  tutorData: TutorSummary['tutorData'];
}

export interface AdminCategoryDemand {
  categoryName: string;
  totalHours: number;
  count: number;
}

// Nota: pese al nombre del endpoint, esto NO es una serie de tiempo
// mensual — es un conteo de reservas de los últimos 30 días agrupado por
// status (ver admin.controller.ts::adminAnalytics). _id aquí es el status.
export interface AdminMonthlyStat {
  _id: BookingStatus;
  count: number;
}

export interface AdminAnalytics {
  topTutors: AdminTopTutor[];
  categoryDemand: AdminCategoryDemand[];
  monthlyStats: AdminMonthlyStat[];
  generatedAt: string;
}

// --- Chat (mensajería en tiempo real) ---
// Ver backend-express/src/sockets/chat.handler.ts y chat.controller.ts: el
// threadId se arma como `${idUsuarioA}_${idUsuarioB}` (ordenados
// alfabéticamente); el evento de socket.io para enviar/recibir un mensaje es
// el mismo en ambos sentidos: "chat:message".

export interface ChatOtherUser {
  _id: string;
  name: string;
  photoUrl?: string;
}

export interface ChatThreadLastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

export interface ChatThread {
  threadId: string;
  otherUser: ChatOtherUser;
  lastMessage: ChatThreadLastMessage;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  // Solo viene poblado en la respuesta REST (Message.find().lean()) — el
  // payload que llega por socket ("chat:message") no lo incluye.
  readBy?: string[];
}
