import { Types } from 'mongoose';
import { User } from '../models/User';
import { Course, type Modality } from '../models/Course';
import { haversineKm } from './geo.service';

export interface SearchTutorsParams {
  studentLat?: number;
  studentLng?: number;
  /** Radio de cercanía en km (necesita studentLat/studentLng). */
  radiusKm?: number;
  categoryId?: string;
  /** Tutores con al menos un curso activo en esa modalidad. */
  modality?: Modality;
  minRating?: number;
  /** Cantidad mínima de reseñas. */
  minReviews?: number;
  /** Rango de precio por hora (tarifa base del tutor). */
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

// Tope de candidatos que se traen de Mongo antes de calcular distancias en memoria.
const MAX_CANDIDATES = 500;

/**
 * Busca tutores aprobados aplicando los filtros del enunciado: cercanía, calificación,
 * cantidad de reseñas, rango de precio, categoría y modalidad. Los filtros que Mongo
 * puede resolver (calificación, reseñas, precio, categoría, modalidad) se aplican en la
 * consulta; la distancia se calcula con Haversine en memoria porque address.coords se
 * guarda como {lat, lng} y no como GeoJSON (decisión D8). Con ubicación, el resultado
 * sale ordenado por cercanía y el límite se aplica DESPUÉS, para no descartar tutores
 * cercanos por quedar fuera de los primeros N.
 */
export const searchTutors = async (params: SearchTutorsParams) => {
  const {
    studentLat, studentLng, radiusKm,
    categoryId, modality,
    minRating, minReviews, minPrice, maxPrice,
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
  if (minReviews !== undefined) filter['tutorData.reviewCount'] = { $gte: minReviews };

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter['tutorData.baseRate'] = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }

  if (modality) {
    const tutorIds = await Course.distinct('tutorId', { active: true, modalities: modality });
    filter._id = { $in: tutorIds };
  }

  const tutors = await User.find(filter)
    .select('name photoUrl address tutorData categoryIds')
    .limit(MAX_CANDIDATES)
    .lean();

  if (studentLat === undefined || studentLng === undefined) return tutors.slice(0, limit);

  const origin = { lat: studentLat, lng: studentLng };
  const withDistance = tutors.map((t) => ({
    ...t,
    distanceKm: Math.round(haversineKm(origin, t.address!.coords) * 100) / 100,
  }));

  return withDistance
    .filter((t) => radiusKm === undefined || t.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};
