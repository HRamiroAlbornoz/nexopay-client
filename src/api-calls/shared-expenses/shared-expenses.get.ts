import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';

const memberSchema = z.object({
  wallet_id: z.string(),
  name: z.string(),
  amount_owed: z.number(),
  amount_paid: z.number(),
});

const sharedExpenseSchema = z.object({
  id: z.string(),
  title: z.string(),
  total_amount: z.number(),
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  status: z.enum(['pending', 'settled']),
  members: z.array(memberSchema),
  created_at: z.string(),
});

const sharedExpensesResponseSchema = z.array(sharedExpenseSchema);

/**
 * GET /api/shared-expenses
 */
export async function getSharedExpenses() {
  const res = await fetch(`${API_BASE_URL}/shared-expenses`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
  return sharedExpensesResponseSchema.parse(raw);
}
