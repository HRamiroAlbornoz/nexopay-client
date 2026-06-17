import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { sharedExpenseSchema } from '../../types/shared-expense.types';

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
