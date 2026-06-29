import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';
import { transactionSchema, type Transaction } from '../../types/transaction.types';

// ─── Esquemas ────────────────────────────────────────────────────────────────

const transactionsResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  page:         z.number(),
  limit:        z.number(),
});

export type TransactionFromApi = Transaction;

// ─── API call ────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions?page=&limit=
 * Retorna el historial paginado de transacciones del usuario autenticado.
 * Default: page=1, limit=20. Máximo limit=100.
 */
export async function getTransactions(page = 1, limit = 20, signal?: AbortSignal) {
  const url = `${API_BASE_URL}/transactions?page=${page}&limit=${limit}`;
  const res = await fetch(url, { credentials: 'include', signal });
  const raw = await parseApiResponse(res);
  return transactionsResponseSchema.parse(raw);
}
