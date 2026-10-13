import mongoose, { Schema, model, Types, type Document } from 'mongoose';

// Tokens que no cambian entre modo claro/oscuro (marca + estados semánticos).
export const INVARIANT_THEME_KEYS = [
  'color-primary',
  'color-primary-dark',
  'color-primary-light',
  'color-danger',
  'color-danger-dark',
  'color-warning',
  'color-warning-dark',
  'color-success',
  'color-success-dark',
  'color-info',
  'on-accent-text',
] as const;

// Tokens con un valor distinto en modo claro y en modo oscuro.
export const REACTIVE_THEME_KEYS = [
  'color-bg',
  'color-surface',
  'color-surface-alt',
  'color-text',
  'color-text-muted',
  'color-text-light',
  'color-border',
  'color-border-strong',
] as const;

export type InvariantThemeKey = (typeof INVARIANT_THEME_KEYS)[number];
export type ReactiveThemeKey = (typeof REACTIVE_THEME_KEYS)[number];

export type InvariantThemeMap = Partial<Record<InvariantThemeKey, string>>;
export type ReactiveThemeMap = Partial<Record<ReactiveThemeKey, string>>;

export interface IThemeSettings extends Document {
  _id: Types.ObjectId;
  invariant: InvariantThemeMap;
  light: ReactiveThemeMap;
  dark: ReactiveThemeMap;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Documento singleton: siempre se busca/actualiza con el mismo filtro fijo
// (ver theme.controller.ts), así que no hace falta un índice único extra.
const themeSettingsSchema = new Schema<IThemeSettings>(
  {
    invariant: { type: Schema.Types.Mixed, default: {} },
    light: { type: Schema.Types.Mixed, default: {} },
    dark: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ThemeSettings = model<IThemeSettings>('ThemeSettings', themeSettingsSchema);
