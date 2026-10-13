import { Request, Response, NextFunction } from 'express';
import { calculateTripPrice } from '../services/geo.service';
import { Unauthorized, BadRequest } from '../utils/errors';

export const calculateDistance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw Unauthorized('No autenticado.');
    const { from, to, baseRate, ratePerKm, hours } = req.body;

    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
      throw BadRequest('Debe enviar from.lat, from.lng, to.lat, to.lng.');
    }
    if (baseRate === undefined || ratePerKm === undefined || !hours) {
      throw BadRequest('Debe enviar baseRate, ratePerKm y hours.');
    }

    const breakdown = calculateTripPrice(baseRate, ratePerKm, hours, from, to);
    res.json({ breakdown });
  } catch (error) { next(error); }
};
