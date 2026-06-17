import { z } from 'zod';

/**
 * Esquema Zod canónico de una meta de ahorro.
 * Fuente de verdad para savings-goals.get.ts y savings-goals.post.ts.
 */
export const savingsGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  status: z.enum(['active', 'completed', 'cancelled']),
  target_date: z.string().nullable(),
});

export type SavingsGoal = z.infer<typeof savingsGoalSchema>;
