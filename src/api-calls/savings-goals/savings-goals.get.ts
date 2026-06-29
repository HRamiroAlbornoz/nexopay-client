import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { savingsGoalSchema } from '../../types/savings-goal.types';
import { parseApiResponse } from '../../lib/apiError';

// GET /api/savings-goals devuelve { goals: [...] }
const savingsGoalsResponseSchema = z.object({
  goals: z.array(savingsGoalSchema),
});

/**
 * GET /api/savings-goals
 * Respuesta: { goals: SavingsGoal[] }
 */
export async function getSavingsGoals(signal?: AbortSignal) {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, { credentials: 'include', signal });
  const raw = await parseApiResponse(res);
  const { goals } = savingsGoalsResponseSchema.parse(raw);
  return goals;
}
