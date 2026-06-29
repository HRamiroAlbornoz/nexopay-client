import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSavingsGoals } from '../api-calls/savings-goals/savings-goals.get';
import { createSavingsGoal, fundSavingsGoal } from '../api-calls/savings-goals/savings-goals.post';
import { handleApiError, getApiErrorMessage } from '../lib/handleApiError';
import type { SavingsGoal } from '../types/savings-goal.types';
import type { Transaction } from '../types/transaction.types';
import type { CurrencyCode } from '../types/currency.types';

export type { SavingsGoal };

export function useSavingsGoals() {
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGoals = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getSavingsGoals(signal);
      setGoals(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      handleApiError(err, setError, 'No se pudieron cargar las metas de ahorro.', logout);
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchGoals(controller.signal);
    return () => controller.abort();
  }, [fetchGoals]);

  const addGoal = useCallback(async (payload: {
    title: string;
    target_amount: number;
    currency_code: CurrencyCode;
    target_date: string | null;
  }): Promise<{ ok: true; goal: SavingsGoal } | { ok: false; message: string }> => {
    try {
      const goal = await createSavingsGoal(payload);
      setGoals((prev) => [goal, ...prev]);
      return { ok: true, goal };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, 'No se pudo crear el objetivo.', logout) };
    }
  }, [logout]);

  const fundGoal = useCallback(async (
    id: string,
    amount: number
  ): Promise<{ ok: true; transaction: Transaction } | { ok: false; message: string }> => {
    try {
      const { goal, transaction } = await fundSavingsGoal(id, amount);
      setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)));
      return { ok: true, transaction };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, 'No se pudo aportar a la meta de ahorro.', logout) };
    }
  }, [logout]);

  return { goals, loading, error, addGoal, fundGoal, refetch: fetchGoals };
}
