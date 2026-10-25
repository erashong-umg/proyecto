import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Course, Modality } from '../types/api';

export interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  modalities: Modality[];
  /** Si se omiten, el curso usa las tarifas del perfil del tutor. */
  baseRate?: number;
  ratePerKm?: number;
}

export const useMyCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ courses: Course[] }>('/courses/me/list')
      .then((res) => setCourses(res.data.courses))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar sus cursos.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: CourseFormData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/courses', data);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el curso.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const update = async (courseId: string, data: CourseFormData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.put(`/courses/${courseId}`, data);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el curso.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deactivate = async (courseId: string): Promise<void> => {
    setError(null);
    try {
      await api.delete(`/courses/${courseId}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo desactivar el curso.'));
    }
  };

  return { courses, isLoading, isSaving, error, create, update, deactivate, reload: load };
};
