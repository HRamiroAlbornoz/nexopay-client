import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { savingsGoalSchema } from '../../types/savings-goal.types';
import { transactionSchema } from '../../types/transaction.types';
import { parseApiResponse } from '../../lib/apiError';
import type { CurrencyCode } from '../../types/currency.types';

// ─── Esquema de respuesta fund ───────────────────────────────────────────────
// POST /:id/fund devuelve { goal, transaction }
const fundResponseSchema = z.object({
  goal:        savingsGoalSchema,
  transaction: transactionSchema,
});

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /api/savings-goals
 * Body: { title, target_amount, currency_code, target_date? }
 */
export async function createSavingsGoal(payload: {
  title:         string;
  target_amount: number;
  currency_code: CurrencyCode;
  target_date?:  string | null;
}) {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });

  const raw = await parseApiResponse(res);
  // Backend devuelve { goal }
  const wrapper = z.object({ goal: savingsGoalSchema }).parse(raw);
  return wrapper.goal;
}

/**
 * POST /api/savings-goals/:id/fund
 * Contribuye un monto a una meta activa. Descuenta del balance de la moneda.
 * Body: { amount }
 * Respuesta: { goal, transaction }
 * Errores: 404 GOAL_NOT_FOUND, 422 GOAL_NOT_ACTIVE / AMOUNT_EXCEEDS_REMAINING / INSUFFICIENT_BALANCE
 */
export async function fundSavingsGoal(id: string, amount: number) {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}/fund`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ amount }),
  });

  const raw = await parseApiResponse(res);
  return fundResponseSchema.parse(raw);
}

/**
 * DELETE /api/savings-goals/:id
 */
export async function deleteSavingsGoal(id: string) {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
    method:      'DELETE',
    credentials: 'include',
  });

  await parseApiResponse(res);
  return true;
}
