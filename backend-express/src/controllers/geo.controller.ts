import { Request, Response, NextFunction } from 'express';
import { getRoute, quoteTrip, type LatLng } from '../services/geo.service';
import { Unauthorized, BadRequest } from '../utils/errors';

const isCoord = (p: unknown): p is LatLng =>
  typeof (p as LatLng)?.lat === 'number' && typeof (p as LatLng)?.lng === 'number'
  && Math.abs((p as LatLng).lat) <= 90 && Math.abs((p as LatLng).lng) <= 180;

// POST /api/geo/route — ruta por calles entre dos puntos (para dibujarla en el mapa).
export const calculateRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const { from, to } = req.body;

    if (!isCoord(from) || !isCoord(to)) {
      throw BadRequest('Debe enviar from y to con lat y lng numéricos válidos.');
    }

    res.json({ route: await getRoute(from, to) });
  } catch (error) { next(error); }
};

// POST /api/geo/distance — ruta + desglose de precio de una tutoría a domicilio.
export const calculateDistance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const { from, to, baseRate, ratePerKm, hours } = req.body;

    if (!isCoord(from) || !isCoord(to)) {
      throw BadRequest('Debe enviar from y to con lat y lng numéricos válidos.');
    }
    if (typeof baseRate !== 'number' || typeof ratePerKm !== 'number' || typeof hours !== 'number' || hours <= 0) {
      throw BadRequest('Debe enviar baseRate, ratePerKm y hours numéricos.');
    }

    const { breakdown, route } = await quoteTrip(baseRate, ratePerKm, hours, from, to);
    res.json({ breakdown, route });
  } catch (error) { next(error); }
};
