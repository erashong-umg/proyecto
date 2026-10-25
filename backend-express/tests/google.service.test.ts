import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from '../src/config/env';

const verifyIdToken = vi.hoisted(() => vi.fn());
vi.mock('google-auth-library', () => ({
  OAuth2Client: class { verifyIdToken = verifyIdToken; },
}));

import { verifyGoogleCredential } from '../src/services/google.service';

const payload = (extra: Record<string, unknown> = {}) => ({
  getPayload: () => ({
    sub: '1234567890', email: 'Ana@Gmail.com', email_verified: true, name: ' Ana Google ',
    picture: 'https://lh3.googleusercontent.com/a.jpg', ...extra,
  }),
});

beforeEach(() => {
  verifyIdToken.mockReset();
  env.GOOGLE_CLIENT_ID = 'mi-cliente.apps.googleusercontent.com';
});

describe('verifyGoogleCredential', () => {
  it('valida el token contra NUESTRO Client ID y normaliza el perfil', async () => {
    verifyIdToken.mockResolvedValue(payload());

    const perfil = await verifyGoogleCredential('token');

    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: 'token', audience: 'mi-cliente.apps.googleusercontent.com' });
    expect(perfil).toEqual({
      googleId: '1234567890',
      email: 'ana@gmail.com',
      name: 'Ana Google',
      photoUrl: 'https://lh3.googleusercontent.com/a.jpg',
    });
  });

  it('usa la parte local del correo si Google no entrega nombre', async () => {
    verifyIdToken.mockResolvedValue(payload({ name: undefined }));

    expect((await verifyGoogleCredential('token')).name).toBe('Ana');
  });

  it('rechaza tokens que Google no valida (firma, vigencia o audiencia incorrectas)', async () => {
    verifyIdToken.mockRejectedValue(new Error('Wrong recipient, payload audience != requiredAudience'));

    await expect(verifyGoogleCredential('token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rechaza correos que Google no tiene verificados', async () => {
    verifyIdToken.mockResolvedValue(payload({ email_verified: false }));

    await expect(verifyGoogleCredential('token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rechaza un token sin correo', async () => {
    verifyIdToken.mockResolvedValue(payload({ email: undefined }));

    await expect(verifyGoogleCredential('token')).rejects.toMatchObject({ statusCode: 401 });
  });
});
