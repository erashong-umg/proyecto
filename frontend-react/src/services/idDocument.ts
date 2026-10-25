// Documento de identificación personal. Espejo de idDocumentSchema en
// backend-express/src/utils/validators.ts: el backend vuelve a validar al guardar.

export type IdDocumentType = 'dpi' | 'pasaporte';

export const ID_DOCUMENT_LABELS: Record<IdDocumentType, string> = {
  dpi: 'DPI',
  pasaporte: 'Pasaporte',
};

// Se aceptan espacios y guiones al escribirlo ("1234 56789 0101").
export const normalizeIdNumber = (value: string): string => value.replace(/[\s-]/g, '').toUpperCase();

// Devuelve el mensaje de error, o null si el número es válido para ese tipo.
export const validateIdNumber = (type: IdDocumentType, value: string): string | null => {
  const number = normalizeIdNumber(value);
  if (!number) return 'Ingrese el número de su documento.';
  if (type === 'dpi' && !/^\d{13}$/.test(number)) return 'El DPI debe tener 13 dígitos.';
  if (type === 'pasaporte' && !/^[A-Z0-9]{6,20}$/.test(number)) {
    return 'El pasaporte debe tener entre 6 y 20 letras o números.';
  }
  return null;
};
