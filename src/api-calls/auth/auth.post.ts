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

// Helper to decode JWT payload from Google Identity Services client-side
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodeURIComponent(json.split('').map((char) => {
      return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`;
    }).join(''))) as unknown;
    return decoded !== null && typeof decoded === 'object' ? (decoded as Record<string, unknown>) : null;
  } catch (error) {
    console.warn('No fue posible leer el perfil de Google.', error);
    return null;
  }
}

// Orchestrator to seamlessly login or auto-register using Google credentials
export async function loginOrRegisterWithGoogle(credential: string): Promise<User> {
  const payload = decodeJwtPayload(credential);
  if (!payload || typeof payload['email'] !== 'string') {
    throw new Error('Token de Google inválido');
  }

  const email   = (payload['email'] as string).toLowerCase();
  const password = `google_oauth_${String(payload['sub'] ?? '')}`;
  const first_name = typeof payload['given_name'] === 'string'  ? payload['given_name']
                   : typeof payload['name']       === 'string'  ? payload['name']
                   : 'Usuario';
  const last_name  = typeof payload['family_name'] === 'string' ? payload['family_name'] : '';

  try {
    // 1. Try to login
    return await loginUser({ email, password });
  } catch (error: unknown) {
    // 2. If it fails with credentials error (401/404) or specific messages, we assume the user is not registered. Let's auto-register
    const isAuthError = error instanceof ApiError && (error.status === 401 || error.status === 404);
    const isMessageError = error instanceof Error && (error.message.includes('inválidas') || error.message.includes('encontrado'));
    
    if (isAuthError || isMessageError) {
      try {
        await registerUser({
          email,
          password,
          first_name,
          last_name,
        });
        // 3. Login after successful registration to establish the cookie session
        return await loginUser({ email, password });
      } catch (regError: unknown) {
        const msg = regError instanceof Error ? regError.message : 'Error en el registro automático con Google';
        throw new Error(msg, { cause: regError });
      }
    }
    throw error;
  }
}
