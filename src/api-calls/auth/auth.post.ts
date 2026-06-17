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
    throw new Error(errorFallback);
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
export function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(json.split('').map((char) => {
      return `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`;
    }).join('')));
  } catch (error) {
    console.warn('No fue posible leer el perfil de Google.', error);
    return null;
  }
}

// Orchestrator to seamlessly login or auto-register using Google credentials
export async function loginOrRegisterWithGoogle(credential: string): Promise<User> {
  const payload = decodeJwtPayload(credential);
  if (!payload || !payload.email) {
    throw new Error('Token de Google inválido');
  }

  const email = payload.email.toLowerCase();
  const password = `google_oauth_${payload.sub}`;
  const first_name = payload.given_name || payload.name || 'Usuario';
  const last_name = payload.family_name || '';

  try {
    // 1. Try to login
    return await loginUser({ email, password });
  } catch (error: any) {
    // 2. If it fails with credentials error, we assume the user is not registered. Let's auto-register
    if (error.message && (error.message.includes('inválidas') || error.message.includes('encontrado'))) {
      try {
        await registerUser({
          email,
          password,
          first_name,
          last_name,
        });
        // 3. Login after successful registration to establish the cookie session
        return await loginUser({ email, password });
      } catch (regError: any) {
        throw new Error(regError.message || 'Error en el registro automático con Google');
      }
    }
    throw error;
  }
}
