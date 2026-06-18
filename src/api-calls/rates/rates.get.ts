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

// ─── API call ────────────────────────────────────────────────────────────────

/**
 * GET /api/rates
 * Devuelve las tasas de cambio actuales.
 * Respuesta: { base: "EUR", rates: { ARS, USD, EUR } }
 * Ruta pública — no requiere cookie de sesión.
 */
export async function getRates(): Promise<RatesResponse> {
  const res = await fetch(`${API_BASE_URL}/rates`, { credentials: 'include' });
  const raw = await parseApiResponse(res);
  return ratesResponseSchema.parse(raw);
}
