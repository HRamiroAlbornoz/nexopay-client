import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import type { CurrencyCode } from '../../types/currency.types';

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

/**
 * POST /api/shared-expenses
 * Crea un nuevo gasto compartido con sus miembros.
 */
export async function createSharedExpense(payload: {
  title: string;
  total_amount: number;
  currency_code: CurrencyCode;
  members: { wallet_id: string; name: string; amount_owed: number; amount_paid: number }[];
}) {
  const res = await fetch(`${API_BASE_URL}/shared-expenses`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
  return sharedExpenseSchema.parse(raw);
}

/**
 * POST /api/shared-expenses/:id/pay
 * Registra el pago de un miembro en un gasto compartido.
 */
export async function settleSharedExpense(id: string, amount_paid: number) {
  const res = await fetch(`${API_BASE_URL}/shared-expenses/${id}/pay`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_paid }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  const raw: unknown = await res.json();
  return sharedExpenseSchema.parse(raw);
}
