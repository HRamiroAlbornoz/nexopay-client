import { z } from 'zod';
import { userSchema, TOKEN_KEY, type User } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const authResponseSchema = z.object({
  token: z.string(),
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
  full_name: string;
}

interface AuthResult {
  token: string;
  user: User;
}

function extractErrorMessage(raw: unknown, fallback: string): string {
  const parsed = errorResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data.message : fallback;
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const raw: unknown = await response.json();

  if (!response.ok) {
    throw new Error(extractErrorMessage(raw, 'Credenciales inválidas'));
  }

  const parsed = authResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Respuesta inesperada del servidor');
  }

  return parsed.data;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const raw: unknown = await response.json();

  if (!response.ok) {
    throw new Error(extractErrorMessage(raw, 'Error al registrarse'));
  }

  const parsed = authResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Respuesta inesperada del servidor');
  }

  return parsed.data;
}

export async function logoutUser(): Promise<void> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
