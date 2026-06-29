import { ApiError } from './apiError';

/**
 * Centraliza el manejo de errores de la API para evitar duplicación en hooks.
 *
 * Uso en fetch de datos (setError disponible):
 *   handleApiError(err, setError, 'Mensaje fallback', logout);
 *
 * Uso en mutaciones (sin setError, retorna mensaje):
 *   return { ok: false, message: getApiErrorMessage(err, 'Mensaje fallback') };
 */

// ─── Variante con setError (para fetchs en useEffect) ────────────────────────

/**
 * Maneja un error de API actualizando el estado de error del hook.
 * - Si es 401, llama a logout() y detiene el flujo.
 * - Si es ApiError con mensaje, lo muestra.
 * - Si es error desconocido, usa el `fallback`.
 *
 * @returns `true` si el error fue un 401 (el caller puede retornar temprano).
 */
export function handleApiError(
  err:      unknown,
  setError: (msg: string) => void,
  fallback: string,
  logout?:  () => void,
): boolean {
  if (err instanceof ApiError) {
    if (err.isUnauthorized()) {
      logout?.();
      return true; // señal: el caller debe retornar inmediatamente
    }
    setError(err.message);
  } else {
    setError(fallback);
  }
  return false;
}

// ─── Variante para mutaciones (retorna mensaje de error) ─────────────────────

/**
 * Extrae el mensaje de error de una excepción para devolverlo en mutaciones.
 * Si es 401, llama logout() antes de retornar el mensaje.
 */
export function getApiErrorMessage(
  err:      unknown,
  fallback: string,
  logout?:  () => void,
): string {
  if (err instanceof ApiError) {
    if (err.isUnauthorized()) {
      logout?.();
    }
    return err.message;
  }
  return fallback;
}
