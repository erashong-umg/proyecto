import type { Category } from '../types/api';

const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Resuelve el texto libre que el usuario escribió contra el catálogo real de
 * categorías (match honesto por substring, no una "IA" que finja entender
 * cualquier cosa). Si no hay match, devuelve undefined y la búsqueda sigue
 * solo por cercanía — no es un callejón sin salida.
 */
export const matchCategory = (query: string, categories: Category[]): Category | undefined => {
  const q = normalize(query);
  if (!q) return undefined;
  return (
    categories.find((c) => normalize(c.name) === q) ??
    categories.find((c) => normalize(c.name).startsWith(q)) ??
    categories.find((c) => normalize(c.name).includes(q))
  );
};
