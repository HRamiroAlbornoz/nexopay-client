import { z } from 'zod';

export const transactionTypeSchema = z.enum([
  'buy',
  'sell',
  'exchange',
  'transfer_in',
  'transfer_out',
  'savings_goal_fund',
  'shared_expense_paid',
  'shared_expense_received',
]);

export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  currency_from: z.enum(['ARS', 'USD', 'EUR']),
  currency_to: z.enum(['ARS', 'USD', 'EUR']),
  amount_from: z.number(),
  amount_to: z.number(),
  exchange_rate: z.number(),
  created_at: z.string(),
  desc: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export type CreateTransactionPayload = Omit<Transaction, 'id' | 'created_at'>;
