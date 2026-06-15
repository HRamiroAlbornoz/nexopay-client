import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';

const savingsGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  status: z.enum(['active', 'completed', 'cancelled']),
  target_date: z.string().nullable(),
});

const savingsGoalsResponseSchema = z.array(savingsGoalSchema);

/**
 * GET /api/savings-goals
 */
export async function getSavingsGoals() {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
  return savingsGoalsResponseSchema.parse(raw);
}
