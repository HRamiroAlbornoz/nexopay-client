import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSharedExpenses } from '../api-calls/shared-expenses/shared-expenses.get';
import { createSharedExpense, settleSharedExpense } from '../api-calls/shared-expenses/shared-expenses.post';
import { handleApiError, getApiErrorMessage } from '../lib/handleApiError';
import type { SharedExpense, SharedExpenseMember } from '../types/shared-expense.types';
import type { Transaction } from '../types/transaction.types';
import type { CurrencyCode } from '../types/currency.types';

export type { SharedExpense, SharedExpenseMember };

export function useSharedExpenses() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExpenses = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getSharedExpenses(signal);
      setExpenses(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      handleApiError(err, setError, 'No se pudieron cargar los gastos compartidos.', logout);
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchExpenses(controller.signal);
    return () => controller.abort();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (payload: {
    title: string;
    total_amount: number;
    currency_code: CurrencyCode;
    members: { wallet_id: string; amount_owed: number }[];
  }): Promise<{ ok: true; expense: SharedExpense } | { ok: false; message: string }> => {
    try {
      const expense = await createSharedExpense(payload);
      setExpenses((prev) => [expense, ...prev]);
      return { ok: true, expense };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, 'No se pudo crear el gasto compartido.', logout) };
    }
  }, [logout]);

  const settleExpense = useCallback(async (
    id: string
  ): Promise<{ ok: true; transaction: Transaction } | { ok: false; message: string }> => {
    try {
      const { expense, transaction } = await settleSharedExpense(id);
      setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
      return { ok: true, transaction };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, 'No se pudo liquidar el gasto compartido.', logout) };
    }
  }, [logout]);

  return { expenses, loading, error, addExpense, settleExpense, refetch: fetchExpenses };
}
