import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

// ─── Esquema ──────────────────────────────────────────────────────────────────

const ratesResponseSchema = z.object({
  base:  z.string(),   // "EUR"
  rates: z.object({
    ARS: z.number(),
    USD: z.number(),
    EUR: z.number(),
  }),
});

export type RatesResponse = z.infer<typeof ratesResponseSchema>;

// ─── Caché en memoria de módulo ───────────────────────────────────────────────
// Evita llamadas repetidas al API cada vez que RightPanel o useExchangeRate
// se montan. La caché vive durante la sesión de navegación (hasta F5/recarga).

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let ratesCache: { data: RatesResponse; expiresAt: number } | null = null;

/** Invalida la caché manualmente (útil en tests o forzar refresco). */
export function invalidateRatesCache(): void {
  ratesCache = null;
}

// ─── API call ────────────────────────────────────────────────────────────────

/**
 * GET /api/rates
 * Devuelve las tasas de cambio actuales con caché de 5 minutos.
 * Ruta pública — no requiere cookie de sesión.
 */
export async function getRates(): Promise<RatesResponse> {
  // Devolver desde caché si aún es válida
  if (ratesCache && Date.now() < ratesCache.expiresAt) {
    return ratesCache.data;
  }

  // Sin credentials: ruta pública, no necesita cookie de sesión
  const res = await fetch(`${API_BASE_URL}/rates`);
  const raw = await parseApiResponse(res);
  const data = ratesResponseSchema.parse(raw);

  ratesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
