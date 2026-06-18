import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSavingsGoals } from '../api-calls/savings-goals/savings-goals.get';
import { createSavingsGoal } from '../api-calls/savings-goals/savings-goals.post';
import { ApiError } from '../lib/apiError';
import type { SavingsGoal } from '../types/savings-goal.types';
import type { CurrencyCode } from '../types/currency.types';

export type { SavingsGoal };

export function useSavingsGoals() {
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getSavingsGoals();
      setGoals(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setError(err.message);
      } else {
        setError('No se pudieron cargar las metas de ahorro.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchGoals es un callback estable; patrón establecido en useTransactions/useWallet
    void fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(async (payload: {
    title: string;
    target_amount: number;
    currency_code: CurrencyCode;
    target_date: string | null;
  }): Promise<boolean> => {
    try {
      const goal = await createSavingsGoal(payload);
      setGoals((prev) => [goal, ...prev]);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized()) {
        logout();
      }
      return false;
    }
  }, [logout]);

  return { goals, loading, error, addGoal, refetch: fetchGoals };
}
