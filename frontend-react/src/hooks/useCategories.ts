import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Category } from '../types/api';

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
}

/** Carga el catálogo público de categorías una sola vez. */
export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => {
        if (!cancelled) setCategories(res.data.categories);
      })
      .catch(() => {
        // Catálogo vacío es un estado válido para renderizar (la UI ya maneja "sin categorías").
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading };
};
