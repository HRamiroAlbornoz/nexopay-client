import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface SharedExpenseMember {
  wallet_id: string;
  name: string;
  amount_owed: number;
  amount_paid: number;
}

export interface SharedExpense {
  id: string;
  title: string;
  total_amount: number;
  currency_code: 'ARS' | 'USD' | 'EUR';
  status: 'pending' | 'settled';
  members: SharedExpenseMember[];
  created_at: string;
}

export function useSharedExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // 1. Create routes `GET /api/shared-expenses` and `POST /api/shared-expenses` connected to shared_expenses and shared_expense_members tables.
  // 2. Create routes `POST /api/shared-expenses/:id/pay` to record member contributions.

  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const mockExpenses: SharedExpense[] = [
        {
          id: '1se',
          title: 'Cena equipo NexoPay',
          total_amount: 6000,
          currency_code: 'ARS',
          status: 'pending',
          created_at: new Date().toISOString(),
          members: [
            {
              wallet_id: 'w4cae933-c80b-4a51-991d-795bcf54eb6d',
              name: 'Hernán Albornoz',
              amount_owed: 3000,
              amount_paid: 3000,
            },
            {
              wallet_id: 'richardWallet',
              name: 'Richard González',
              amount_owed: 3000,
              amount_paid: 0,
            },
          ],
        },
      ];

      setExpenses(mockExpenses);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const addExpense = async (expense: Omit<SharedExpense, 'id' | 'status' | 'created_at'>) => {
    const newExpense: SharedExpense = {
      ...expense,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, newExpense]);
    return true;
  };

  return { expenses, loading, addExpense };
}
