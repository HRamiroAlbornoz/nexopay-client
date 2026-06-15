import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import type { CurrencyCode } from '../../types/currency.types';

const savingsGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  status: z.enum(['active', 'completed', 'cancelled']),
  target_date: z.string().nullable(),
});

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
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
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
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
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
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  return true;
}
