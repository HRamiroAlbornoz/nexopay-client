import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency_code: 'ARS' | 'USD' | 'EUR';
  status: 'active' | 'completed' | 'cancelled';
  target_date: string | null;
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // TAREA PENDIENTE EN EL BACKEND PARA HERNÁN ALBORNOZ:
  // 1. Crear las rutas `GET /api/savings-goals` y `POST /api/savings-goals` vinculadas con la tabla postgres `savings_goals`.
  // 2. Crear las rutas `PATCH /api/savings-goals/:id` para actualizar metas o registrar contribuciones.

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const mockGoals: SavingsGoal[] = [
        {
          id: '1sg',
          title: 'Viaje a Europa',
          target_amount: 5000,
          current_amount: 500,
          currency_code: 'USD',
          status: 'active',
          target_date: '2026-12-31',
        },
        {
          id: '2sg',
          title: 'Auto nuevo',
          target_amount: 10000,
          current_amount: 2000,
          currency_code: 'USD',
          status: 'active',
          target_date: '2027-06-30',
        },
        {
          id: '3sg',
          title: 'Fondo de emergencia',
          target_amount: 1000,
          current_amount: 1000,
          currency_code: 'USD',
          status: 'completed',
          target_date: null,
        },
      ];

      setGoals(mockGoals);
      setLoading(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [user]);

  const addGoal = async (goal: Omit<SavingsGoal, 'id' | 'status'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: Math.random().toString(36).substring(7),
      status: 'active',
    };
    setGoals((prev) => [...prev, newGoal]);
    return true;
  };

  return { goals, loading, addGoal };
}
