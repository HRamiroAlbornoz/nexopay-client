import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

// ─── Esquemas ────────────────────────────────────────────────────────────────

const transactionSchema = z.object({
  id:            z.string(),
  type:          z.enum(['buy', 'sell', 'exchange', 'transfer_in', 'transfer_out']),
  currency_from: z.enum(['ARS', 'USD', 'EUR']),
  currency_to:   z.enum(['ARS', 'USD', 'EUR']),
  amount_from:   z.number(),
  amount_to:     z.number(),
  exchange_rate: z.number(),
  created_at:    z.string(),
  desc:          z.string().optional(),
});

const transactionsResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  page:         z.number(),
  limit:        z.number(),
});

export type TransactionFromApi = z.infer<typeof transactionSchema>;

// ─── API call ────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions?page=&limit=
 * Retorna el historial paginado de transacciones del usuario autenticado.
 * Default: page=1, limit=20. Máximo limit=100.
 */
export async function getTransactions(page = 1, limit = 20) {
  const url = `${API_BASE_URL}/transactions?page=${page}&limit=${limit}`;
  const res = await fetch(url, { credentials: 'include' });
  const raw = await parseApiResponse(res);
  return transactionsResponseSchema.parse(raw);
}
