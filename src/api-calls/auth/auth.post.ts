import { z } from 'zod';
import { userSchema, type User } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse, ApiError } from '../../lib/apiError';

const authResponseSchema = z.object({
  user: userSchema,
});

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

async function postAuthEndpoint(path: string, body: unknown, errorFallback: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  let raw: unknown;
  try {
    raw = await parseApiResponse(response);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Preserve the original cause so the error chain is traceable
    throw new Error(errorFallback, { cause: err });
  }

  const parsed = authResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Zod parsing error:', parsed.error);
    throw new Error('Respuesta inesperada del servidor');
  }

  return parsed.data.user;
}

export function loginUser(input: LoginInput): Promise<User> {
  return postAuthEndpoint('/auth/login', input, 'Credenciales inválidas');
}

export function registerUser(input: RegisterInput): Promise<User> {
  return postAuthEndpoint('/auth/register', input, 'Error al registrarse');
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No se pudo cerrar sesión en el servidor');
  }
}

/**
 * Decodes the payload section of a Google Identity Services JWT.
 * Returns a typed record of the standard OIDC claims we use, or null if
 * the token is malformed or cannot be decoded.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(
      decodeURIComponent(
        json.split('').map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''),
      ),
    ) as unknown;
    return decoded !== null && typeof decoded === 'object'
      ? (decoded as Record<string, unknown>)
      : null;
  } catch (error) {
    console.warn('No fue posible leer el perfil de Google.', error);
    return null;
  }
}

/** Orchestrator that seamlessly logs in or auto-registers a user via Google credentials. */
export async function loginOrRegisterWithGoogle(credential: string): Promise<User> {
  const payload = decodeJwtPayload(credential);
  if (!payload || typeof payload['email'] !== 'string') {
    throw new Error('Token de Google inválido');
  }

  const email      = payload['email'].toLowerCase();
  const password   = `google_oauth_${String(payload['sub'] ?? '')}`;
  const first_name = typeof payload['given_name'] === 'string' ? payload['given_name']
                   : typeof payload['name']       === 'string' ? payload['name']
                   : 'Usuario';
  const last_name  = typeof payload['family_name'] === 'string' ? payload['family_name'] : '';

  try {
    // 1. Try to log in with the derived credentials
    return await loginUser({ email, password });
  } catch (loginError: unknown) {
    // 2. If the account does not exist (401/404) or the message matches common
    //    "not found / invalid" patterns, auto-register and then log in.
    const isAuthError    = loginError instanceof ApiError && (loginError.status === 401 || loginError.status === 404);
    const isMessageError = loginError instanceof Error &&
      (loginError.message.includes('inválidas') || loginError.message.includes('encontrado'));

    if (isAuthError || isMessageError) {
      try {
        await registerUser({ email, password, first_name, last_name });
        // 3. Log in after successful registration to establish the session cookie
        return await loginUser({ email, password });
      } catch (regError: unknown) {
        const msg = regError instanceof Error ? regError.message : 'Error en el registro automático con Google';
        throw new Error(msg, { cause: regError });
      }
    }

    throw loginError;
  }
}
