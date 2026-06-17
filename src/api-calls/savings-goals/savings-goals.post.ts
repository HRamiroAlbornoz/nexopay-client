import { API_BASE_URL } from '../../lib/apiConfig';
import type { CurrencyCode } from '../../types/currency.types';
import { savingsGoalSchema } from '../../types/savings-goal.types';
import { parseApiResponse } from '../../lib/apiError';

/**
 * POST /api/savings-goals
 */
export async function createSavingsGoal(payload: {
  title: string;
  target_amount: number;
  current_amount: number;
  currency_code: CurrencyCode;
  target_date: string | null;
}) {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw: unknown = await parseApiResponse(res);
  return savingsGoalSchema.parse(raw);
}

/**
 * PATCH /api/savings-goals/:id
 * Actualiza el monto actual (contribución) o el estado de una meta.
 */
export async function updateSavingsGoal(
  id: string,
  payload: { current_amount?: number; status?: 'active' | 'completed' | 'cancelled' }
) {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw: unknown = await parseApiResponse(res);
  return savingsGoalSchema.parse(raw);
}

/**
 * DELETE /api/savings-goals/:id
 */
export async function deleteSavingsGoal(id: string) {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await parseApiResponse(res);
  return true;
}
