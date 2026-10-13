import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import type { Category } from '../types/api';

export interface CategoryFormData {
  name: string;
  slug: string;
}

/** Genera un slug legible a partir de un nombre: minúsculas, sin acentos, con guiones. */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');

// CRUD de categorías para el panel admin. El listado usa el endpoint público
// GET /api/categories (el mismo que consume useCategories) porque no hay un
// GET admin-only separado; crear/editar/eliminar sí van contra
// /api/admin/categories, montados en backend-express/src/routes/admin.routes.ts.
export const useAdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.data.categories))
      .catch((err) => setError(getErrorMessage(err, 'No se pudieron cargar las categorías.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: CategoryFormData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.post('/admin/categories', data);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la categoría.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const update = async (categoryId: string, data: CategoryFormData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      await api.put(`/admin/categories/${categoryId}`, data);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la categoría.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (categoryId: string): Promise<boolean> => {
    setError(null);
    try {
      await api.delete(`/admin/categories/${categoryId}`);
      load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo eliminar la categoría.'));
      return false;
    }
  };

  return { categories, isLoading, isSaving, error, create, update, remove, reload: load };
};
