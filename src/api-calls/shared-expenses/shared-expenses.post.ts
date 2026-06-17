import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { sharedExpenseSchema } from '../../types/shared-expense.types';
import { parseApiResponse } from '../../lib/apiError';
import type { CurrencyCode } from '../../types/currency.types';

// ─── Esquema de respuesta settle ─────────────────────────────────────────────
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

const settleResponseSchema = z.object({
  expense:     sharedExpenseSchema,
  transaction: transactionSchema,
});

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /api/shared-expenses
 * Body: { title, total_amount, currency_code, members: [{ wallet_id, amount_owed }] }
 * El creador debe estar en members; su parte queda saldada automáticamente.
 * Respuesta: { expense }
 */
export async function createSharedExpense(payload: {
  title:         string;
  total_amount:  number;
  currency_code: CurrencyCode;
  members:       { wallet_id: string; amount_owed: number }[];
}) {
  const res = await fetch(`${API_BASE_URL}/shared-expenses`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });

  const raw = await parseApiResponse(res);
  const wrapper = z.object({ expense: sharedExpenseSchema }).parse(raw);
  return wrapper.expense;
}

/**
 * POST /api/shared-expenses/:id/settle
 * Sin body — liquida la deuda del usuario autenticado en el gasto compartido.
 * Respuesta: { expense, transaction }
 * Errores: 403 NOT_MEMBER, 404 EXPENSE_NOT_FOUND, 422 ALREADY_PAID / INSUFFICIENT_BALANCE
 */
export async function settleSharedExpense(id: string) {
  const res = await fetch(`${API_BASE_URL}/shared-expenses/${id}/settle`, {
    method:      'POST',
    credentials: 'include',
  });

  const raw = await parseApiResponse(res);
  return settleResponseSchema.parse(raw);
}
