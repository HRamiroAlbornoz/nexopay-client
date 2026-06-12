import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'exchange' | 'transfer_in' | 'transfer_out';
  currency_from: 'ARS' | 'USD' | 'EUR';
  currency_to: 'ARS' | 'USD' | 'EUR';
  amount_from: number;
  amount_to: number;
  exchange_rate: number;
  created_at: string;
  desc?: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // 1. Create a route `GET /api/transactions` that joins wallets and transactions to return the user's logs.
  // 2. Create routes `POST /api/transactions/buy`, `POST /api/transactions/sell` and `/exchange` that:
  //    - Validates inputs (sufficient balances).
  //    - Performs the numeric conversions.
  //    - Updates the balance in the balances table.
  //    - Writes a new record in the transactions table.
  //    - Returns the updated balance and transaction receipt.

  useEffect(() => {
    if (!user) return;

    // Simulate fetching transaction history from PostgreSQL backend
    // Only active currencies are ARS, USD, and EUR as specified in seeds.
    const timer = setTimeout(() => {
      const mockLogs: Transaction[] = [
        {
          id: '1t',
          type: 'buy',
          currency_from: 'ARS',
          currency_to: 'USD',
          amount_from: 50000,
          amount_to: 50,
          exchange_rate: 0.001,
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          desc: 'Compra de USD con saldo ARS',
        },
        {
          id: '2t',
          type: 'exchange',
          currency_from: 'USD',
          currency_to: 'EUR',
          amount_from: 22,
          amount_to: 20,
          exchange_rate: 0.909,
          created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
          desc: 'Conversión de saldo USD a EUR',
        },
        {
          id: '3t',
          type: 'transfer_out',
          currency_from: 'ARS',
          currency_to: 'ARS',
          amount_from: 10000,
          amount_to: 10000,
          exchange_rate: 1.0,
          created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          desc: 'Transferencia enviada a Hernán Albornoz',
        },
        {
          id: '4t',
          type: 'sell',
          currency_from: 'EUR',
          currency_to: 'ARS',
          amount_from: 50,
          amount_to: 55000,
          exchange_rate: 1100,
          created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          desc: 'Venta de EUR a saldo ARS',
        },
      ];

      setTransactions(user.email === 'richard@nexopay.com' ? mockLogs.slice(1) : mockLogs);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [user]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    // Propose backend request:
    // await fetch(`/api/transactions/${tx.type}`, { method: 'POST', body: JSON.stringify(tx) })
    
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      desc: tx.type === 'buy' ? `Compra de ${tx.currency_to} con saldo ${tx.currency_from}` :
            tx.type === 'sell' ? `Venta de ${tx.currency_from} a saldo ${tx.currency_to}` :
            `Conversión de saldo ${tx.currency_from} a ${tx.currency_to}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  return { transactions, loading, addTransaction };
}
