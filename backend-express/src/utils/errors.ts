export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const BadRequest = (msg: string, details?: unknown) => new ApiError(400, msg, details);
export const Unauthorized = (msg = 'No autorizado') => new ApiError(401, msg);
export const Forbidden = (msg = 'Acceso denegado') => new ApiError(403, msg);
export const NotFound = (msg = 'Recurso no encontrado') => new ApiError(404, msg);
export const Conflict = (msg: string, details?: unknown) => new ApiError(409, msg, details);
export const InternalError = (msg = 'Error interno del servidor') => new ApiError(500, msg);
