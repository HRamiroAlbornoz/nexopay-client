import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

// ─── Esquemas ────────────────────────────────────────────────────────────────

const walletInfoSchema = z.object({
  id:         z.string(),
  created_at: z.string(),
});

const walletBalanceSchema = z.object({
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  amount:        z.number(),
});

const walletBalancesSchema = z.array(walletBalanceSchema);

export type WalletInfo    = z.infer<typeof walletInfoSchema>;
export type WalletBalance = z.infer<typeof walletBalanceSchema>;

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * GET /api/wallet
 * Devuelve el id y fecha de creación de la billetera del usuario autenticado.
 */
export async function getWallet(): Promise<WalletInfo> {
  const res = await fetch(`${API_BASE_URL}/wallet`, { credentials: 'include' });
  const raw = await parseApiResponse(res);
  return walletInfoSchema.parse(raw);
}

/**
 * GET /api/wallet/balances
 * Devuelve los balances por moneda: [{ currency_code, amount }] × 3 (ARS, USD, EUR).
 */
export async function getWalletBalances(): Promise<WalletBalance[]> {
  const res = await fetch(`${API_BASE_URL}/wallet/balances`, { credentials: 'include' });
  const raw = await parseApiResponse(res);
  return walletBalancesSchema.parse(raw);
}
