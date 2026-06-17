import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';

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
  const res = await fetch(`${API_BASE_URL}/wallet`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Error ${res.status} al obtener billetera`);
  }
  const raw: unknown = await res.json();
  return walletSchema.parse(raw);
}
