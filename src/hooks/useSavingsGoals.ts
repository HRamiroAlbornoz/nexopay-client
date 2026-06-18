import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getSavingsGoals } from '../api-calls/savings-goals/savings-goals.get';
import { createSavingsGoal, fundSavingsGoal } from '../api-calls/savings-goals/savings-goals.post';
import { ApiError } from '../lib/apiError';
import type { SavingsGoal } from '../types/savings-goal.types';

// Re-export so existing consumers don't break
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
        if (err.isUnauthorized()) { logout(); return; }
        setError(err.message);
      } else {
        setError('No se pudieron cargar las metas de ahorro.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchGoals is a stable callback ref; established pattern in codebase
    void fetchGoals();
  }, [fetchGoals]);

  /** Crea una meta en el backend y la agrega al estado local. */
  const addGoal = useCallback(async (payload: {
    title: string;
    target_amount: number;
    currency_code: 'ARS' | 'USD' | 'EUR';
    target_date?: string | null;
  }): Promise<SavingsGoal> => {
    const goal = await createSavingsGoal(payload);
    setGoals((prev) => [goal, ...prev]);
    return goal;
  }, []);

  /** Contribuye un monto a una meta activa y sincroniza el estado. */
  const fundGoal = useCallback(async (id: string, amount: number) => {
    const { goal } = await fundSavingsGoal(id, amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)));
    return goal;
  }, []);

  return { goals, loading, error, addGoal, fundGoal, refetch: fetchGoals };
}
