import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { savingsGoalSchema } from '../../types/savings-goal.types';
import { parseApiResponse } from '../../lib/apiError';

const savingsGoalsResponseSchema = z.array(savingsGoalSchema);

/**
 * GET /api/savings-goals
 */
export async function getSavingsGoals() {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, { credentials: 'include' });
  const raw: unknown = await parseApiResponse(res);
  return savingsGoalsResponseSchema.parse(raw);
}
