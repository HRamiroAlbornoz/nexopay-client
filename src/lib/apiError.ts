export class ApiError extends Error {
  public code?: string;
  public details?: unknown;
  public status: number;

  constructor(params: { message: string; code?: string; details?: unknown; status: number }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.details = params.details;
    this.status = params.status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Parsea la respuesta de la API.
 * - Si `res.ok` devuelve el body parseado (o texto si no es JSON).
 * - Si no, lanza `ApiError` con `code`, `message`, `details` y `status`.
 */
export async function parseApiResponse(res: Response): Promise<any> {
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

  const code = raw && typeof raw === 'object' && 'code' in (raw as any) ? (raw as any).code : undefined;
  const message = raw && typeof raw === 'object' && 'message' in (raw as any) ? (raw as any).message : `Error ${res.status}`;
  const details = raw && typeof raw === 'object' && 'details' in (raw as any) ? (raw as any).details : undefined;

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
