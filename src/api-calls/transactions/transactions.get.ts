import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(['buy', 'sell', 'exchange', 'transfer_in', 'transfer_out']),
  currency_from: z.enum(['ARS', 'USD', 'EUR']),
  currency_to: z.enum(['ARS', 'USD', 'EUR']),
  amount_from: z.number(),
  amount_to: z.number(),
  exchange_rate: z.number(),
  created_at: z.string(),
  desc: z.string().optional(),
});

const transactionsResponseSchema = z.array(transactionSchema);

/**
 * GET /api/transactions
 * Retorna el historial de transacciones del usuario autenticado.
 */
export async function getTransactions() {
  const res = await fetch(`${API_BASE_URL}/transactions`, { credentials: 'include' });
  const raw: unknown = await parseApiResponse(res);
  return transactionsResponseSchema.parse(raw);
}
