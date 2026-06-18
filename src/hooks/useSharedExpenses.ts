import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSharedExpenses } from '../api-calls/shared-expenses/shared-expenses.get';
import { createSharedExpense } from '../api-calls/shared-expenses/shared-expenses.post';
import { ApiError } from '../lib/apiError';
import type { SharedExpense, SharedExpenseMember } from '../types/shared-expense.types';
import type { CurrencyCode } from '../types/currency.types';

export type { SharedExpense, SharedExpenseMember };

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
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setError(err.message);
      } else {
        setError('No se pudieron cargar los gastos compartidos.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchExpenses es un callback estable; patrón establecido en useTransactions/useWallet
    void fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (payload: {
    title: string;
    total_amount: number;
    currency_code: CurrencyCode;
    members: { wallet_id: string; amount_owed: number }[];
  }): Promise<boolean> => {
    try {
      const expense = await createSharedExpense(payload);
      setExpenses((prev) => [expense, ...prev]);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized()) {
        logout();
      }
      return false;
    }
  }, [logout]);

  return { expenses, loading, error, addExpense, refetch: fetchExpenses };
}
