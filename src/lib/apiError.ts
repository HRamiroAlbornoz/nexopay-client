export class ApiError extends Error {
  public code?: string | undefined;
  public details?: unknown | undefined;
  public status: number;

  constructor(params: { message: string; code?: string | undefined; details?: unknown | undefined; status: number }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.details = params.details;
    this.status = params.status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Devuelve true si el error indica sesión vencida o ausente. */
  isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/**
 * Parsea la respuesta de la API.
 * - Si `res.ok` devuelve el body parseado.
 * - Si no, lanza `ApiError` con `code`, `message`, `details` y `status`.
 *
 * Los errores 401 (MISSING_TOKEN / INVALID_TOKEN) se propagan normalmente:
 * el interceptor global en AuthContext los captura y redirige a login.
 */
export async function parseApiResponse(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  let raw: unknown = null;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }

  if (res.ok) {
    return raw ?? (text === '' ? null : text);
  }

  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const code    = typeof body['code']    === 'string' ? body['code']    : undefined;
  const message = typeof body['message'] === 'string' ? body['message'] : `Error ${res.status}`;
  const details = 'details' in body ? body['details'] : undefined;

  throw new ApiError({ message, code, details, status: res.status });
}

/**
 * Helper ligero para intentar parsear JSON y devolver `null` si falla.
 */
export async function safeParseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
