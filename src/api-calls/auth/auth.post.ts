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

/**
 * Autentica al usuario con Google Identity Services.
 *
 * El frontend recibe un `credential` (ID token JWT firmado por Google) del SDK de GSI
 * y lo reenvía tal cual al backend para verificación criptográfica.
 *
 * ⚠️  El frontend NUNCA decodifica ni interpreta el token de Google.
 *     Derivar una contraseña a partir del `sub` del payload sería un vector de
 *     suplantación de identidad — cualquiera que conozca el `sub` de un usuario
 *     podría calcular la misma "contraseña" sin pasar por Google.
 *
 * El backend:
 *  1. Verifica el token con la clave pública de Google.
 *  2. Crea la cuenta si es la primera vez, la vincula si ya existía con ese email,
 *     o la loguea si ya usó Google antes.
 *  3. Setea la cookie de sesión igual que /login.
 *
 * Respuestas posibles:
 *  - 200 { user } → cuenta existente (logueada o vinculada)
 *  - 201 { user } → cuenta nueva creada automáticamente
 *  Ambas tienen la misma forma: { id, email, first_name, last_name }
 *
 * Errores:
 *  - 400 VALIDATION_ERROR        → falta el credential en el body
 *  - 401 INVALID_GOOGLE_TOKEN    → token expirado, manipulado o client_id incorrecto
 *  - 403 GOOGLE_EMAIL_NOT_VERIFIED → email de Google sin verificar (caso raro, Workspace)
 */
export function loginWithGoogle(credential: string): Promise<User> {
  return postAuthEndpoint('/auth/google', { credential }, 'Error al iniciar sesión con Google');
}
