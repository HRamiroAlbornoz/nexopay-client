import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

const walletBalanceSchema = z.object({
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  amount: z.number(),
});

const walletSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  balances: z.array(walletBalanceSchema),
});

/**
 * GET /api/wallet
 * Devuelve la billetera del usuario autenticado con sus balances.
 * Requiere cookie httpOnly — usar credentials: 'include'.
 */
export async function getWallet() {
  const res = await fetch(`${API_BASE_URL}/wallet`, { credentials: 'include' });
  const raw: unknown = await parseApiResponse(res);
  return walletSchema.parse(raw);
}
