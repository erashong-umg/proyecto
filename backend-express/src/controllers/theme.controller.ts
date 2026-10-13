import { Request, Response, NextFunction } from 'express';
import { ThemeSettings } from '../models/ThemeSettings';
import type { ThemeSettingsInput } from '../utils/validators';

// Documento singleton: siempre el mismo filtro fijo, nunca hay más de uno.
const SINGLETON_FILTER = {};

export const getThemeSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await ThemeSettings.findOne(SINGLETON_FILTER).lean();
    res.json({
      theme: settings
        ? { invariant: settings.invariant, light: settings.light, dark: settings.dark }
        : { invariant: {}, light: {}, dark: {} },
    });
  } catch (error) { next(error); }
};

export const updateThemeSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { invariant, light, dark } = req.body as ThemeSettingsInput;
    const settings = await ThemeSettings.findOneAndUpdate(
      SINGLETON_FILTER,
      {
        $set: {
          ...(invariant ? { invariant } : {}),
          ...(light ? { light } : {}),
          ...(dark ? { dark } : {}),
          updatedBy: req.user?.id,
        },
      },
      { new: true, upsert: true }
    ).lean();
    res.json({ theme: { invariant: settings.invariant, light: settings.light, dark: settings.dark } });
  } catch (error) { next(error); }
};

export const resetThemeSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await ThemeSettings.findOneAndUpdate(
      SINGLETON_FILTER,
      { $set: { invariant: {}, light: {}, dark: {}, updatedBy: req.user?.id } },
      { upsert: true }
    );
    res.json({ theme: { invariant: {}, light: {}, dark: {} } });
  } catch (error) { next(error); }
};
