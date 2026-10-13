import { Types } from 'mongoose';
import { User } from '../models/User';

export interface SearchTutorsParams {
  studentLat?: number;
  studentLng?: number;
  radiusKm?: number;
  categoryId?: string;
  modality?: 'virtual' | 'presencial-tutor' | 'presencial-estudiante';
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export const searchTutors = async (params: SearchTutorsParams) => {
  const {
    studentLat, studentLng, radiusKm,
    categoryId,
    minRating, minPrice, maxPrice,
    limit = 50,
  } = params;

  const filter: Record<string, unknown> = {
    role: 'tutor',
    status: 'active',
    'tutorData.approved': true,
    'address.coords': { $exists: true },
  };

  if (categoryId) filter['tutorData.categories'] = new Types.ObjectId(categoryId);
  if (minRating !== undefined) filter['tutorData.avgRating'] = { $gte: minRating };

  // El filtro de precio por hora se aplica DESPUÉS (sobre los cursos del tutor)
  // Para simplicidad, asumimos que el tutor tiene un "precio base" en tutorData.baseRate

  let tutors = await User.find(filter)
    .select('name photoUrl address tutorData categoryIds')
    .limit(limit)
    .lean();

  // Aplicar filtro de precio en memoria (suficiente para pocos tutores)
  if (minPrice !== undefined || maxPrice !== undefined) {
    tutors = tutors.filter((t) => {
      if (!t.tutorData) return false;
      const r = t.tutorData.baseRate;
      if (minPrice !== undefined && r < minPrice) return false;
      if (maxPrice !== undefined && r > maxPrice) return false;
      return true;
    });
  }

  // Filtro geoespacial: sin índice 2dsphere (address.coords se guarda como {lat, lng},
  // no GeoJSON, así que $geoWithin/$centerSphere no aplica) — se calcula Haversine
  // en memoria sobre los candidatos, igual que el filtro de precio arriba.
  if (studentLat !== undefined && studentLng !== undefined) {
    const withDistance = tutors.map((t) => {
      if (!t.address?.coords) return { ...t, distanceKm: undefined as number | undefined };
      const distanceKm = haversineKmLocal({ lat: studentLat, lng: studentLng }, t.address.coords);
      return { ...t, distanceKm: Math.round(distanceKm * 100) / 100 };
    });

    if (radiusKm) {
      return withDistance.filter((t) => t.distanceKm !== undefined && t.distanceKm <= radiusKm);
    }
    return withDistance;
  }

  return tutors;
};

const haversineKmLocal = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};
