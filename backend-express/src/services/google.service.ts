import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { Unauthorized } from '../utils/errors';

export interface GoogleProfile {
  googleId: string;      // "sub": id estable de la cuenta de Google
  email: string;
  name: string;
  photoUrl?: string;
}

const client = new OAuth2Client();

/**
 * Verifica el ID token (JWT) que entrega el botón de Google: firma con las
 * claves públicas de Google, vigencia, emisor y que el token fue emitido para
 * NUESTRO Client ID (audience). Solo se aceptan correos verificados por Google.
 */
export const verifyGoogleCredential = async (credential: string): Promise<GoogleProfile> => {
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw Unauthorized('No se pudo verificar la cuenta de Google. Intente de nuevo.');
  }

  if (!payload?.sub || !payload.email) throw Unauthorized('La cuenta de Google no entregó un correo.');
  if (!payload.email_verified) throw Unauthorized('El correo de su cuenta de Google no está verificado.');

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name?.trim() || payload.email.split('@')[0],
    photoUrl: payload.picture,
  };
};
