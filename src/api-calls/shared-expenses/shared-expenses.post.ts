import { API_BASE_URL } from '../../lib/apiConfig';
import type { CurrencyCode } from '../../types/currency.types';
import { sharedExpenseSchema } from '../../types/shared-expense.types';

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
