import { z } from 'zod';

/**
 * Esquema Zod canónico de un miembro de gasto compartido.
 */
export const memberSchema = z.object({
  wallet_id: z.string(),
  // El backend no devuelve "name" en la respuesta de POST /shared-expenses (recién creado),
  // aunque sí lo trae GET /shared-expenses en algunos casos — por eso es opcional acá,
  // y el frontend resuelve el nombre a mostrar localmente (ver SharedExpenses.tsx).
  name: z.string().optional(),
  amount_owed: z.number(),
  amount_paid: z.number(),
});

/**
 * Esquema Zod canónico de un gasto compartido.
 * Fuente de verdad para shared-expenses.get.ts y shared-expenses.post.ts.
 */
export const sharedExpenseSchema = z.object({
  id: z.string(),
  title: z.string(),
  total_amount: z.number(),
  currency_code: z.enum(['ARS', 'USD', 'EUR']),
  status: z.enum(['pending', 'settled']),
  members: z.array(memberSchema),
  created_at: z.string(),
});

export type SharedExpenseMember = z.infer<typeof memberSchema>;
export type SharedExpense = z.infer<typeof sharedExpenseSchema>;
