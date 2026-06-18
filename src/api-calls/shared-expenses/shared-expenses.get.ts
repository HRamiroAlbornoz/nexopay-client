import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { sharedExpenseSchema } from '../../types/shared-expense.types';
import { parseApiResponse } from '../../lib/apiError';

// GET /api/shared-expenses devuelve { expenses: [...], page, limit }
const sharedExpensesResponseSchema = z.object({
  expenses: z.array(sharedExpenseSchema),
  page:     z.number(),
  limit:    z.number(),
});

/**
 * GET /api/shared-expenses?page=&limit=
 * Respuesta: { expenses: SharedExpense[], page, limit }
 */
export async function getSharedExpenses(page = 1, limit = 20) {
  const url = `${API_BASE_URL}/shared-expenses?page=${page}&limit=${limit}`;
  const res = await fetch(url, { credentials: 'include' });
  const raw = await parseApiResponse(res);
  const { expenses } = sharedExpensesResponseSchema.parse(raw);
  return expenses;
}
