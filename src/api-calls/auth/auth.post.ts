import { z } from 'zod';
import { userSchema, type User } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/apiConfig';

const authResponseSchema = z.object({
  user: userSchema,
});

const errorResponseSchema = z.object({ message: z.string() });

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

function extractErrorMessage(raw: unknown, fallback: string): string {
  const parsed = errorResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data.message : fallback;
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function postAuthEndpoint(path: string, body: unknown, errorFallback: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const raw = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(raw, errorFallback));
  }

  const parsed = authResponseSchema.safeParse(raw);
  if (!parsed.success) {
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
