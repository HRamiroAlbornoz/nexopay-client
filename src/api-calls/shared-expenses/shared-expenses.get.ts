import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { sharedExpenseSchema } from '../../types/shared-expense.types';
import { parseApiResponse } from '../../lib/apiError';

const sharedExpensesResponseSchema = z.array(sharedExpenseSchema);

/**
 * GET /api/shared-expenses
 */
export async function getSharedExpenses() {
  const res = await fetch(`${API_BASE_URL}/shared-expenses`, { credentials: 'include' });
  const raw: unknown = await parseApiResponse(res);
  return sharedExpensesResponseSchema.parse(raw);
}
