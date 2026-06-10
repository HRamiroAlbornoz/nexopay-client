import { z } from 'zod';
import { userSchema, type User } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const authResponseSchema = z.object({ user: userSchema });
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

export async function loginUser(input: LoginInput): Promise<User> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

  return parsed.data.user;
}

export async function registerUser(input: RegisterInput): Promise<User> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

  return parsed.data.user;
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
