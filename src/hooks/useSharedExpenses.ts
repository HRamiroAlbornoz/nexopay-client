import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSharedExpenses } from '../api-calls/shared-expenses/shared-expenses.get';
import { createSharedExpense, settleSharedExpense } from '../api-calls/shared-expenses/shared-expenses.post';
import { ApiError } from '../lib/apiError';
import type { SharedExpense } from '../types/shared-expense.types';

// Re-export so existing consumers don't break
export type { SharedExpense };
export type { SharedExpenseMember } from '../types/shared-expense.types';

export function useSharedExpenses() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getSharedExpenses();
      setExpenses(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) { logout(); return; }
        setError(err.message);
      } else {
        setError('No se pudieron cargar los gastos compartidos.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchExpenses is a stable callback ref; established pattern in codebase
    void fetchExpenses();
  }, [fetchExpenses]);

  /** Crea un gasto compartido en el backend. */
  const addExpense = useCallback(async (payload: {
    title: string;
    total_amount: number;
    currency_code: 'ARS' | 'USD' | 'EUR';
    members: { wallet_id: string; amount_owed: number }[];
  }): Promise<SharedExpense> => {
    const expense = await createSharedExpense(payload);
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  /** Liquida la deuda del usuario autenticado en un gasto compartido. */
  const settleExpense = useCallback(async (id: string) => {
    const { expense } = await settleSharedExpense(id);
    setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
    return expense;
  }, []);

  return { expenses, loading, error, addExpense, settleExpense, refetch: fetchExpenses };
}
