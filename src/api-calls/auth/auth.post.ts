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

export function loginOrRegisterWithGoogle(credential: string): Promise<User> {
  return postAuthEndpoint('/auth/google', { credential }, 'No se pudo iniciar sesión con Google');
}
