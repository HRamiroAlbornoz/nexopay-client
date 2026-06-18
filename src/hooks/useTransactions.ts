import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getTransactions, type TransactionFromApi } from '../api-calls/transactions/transactions.get';
import { ApiError } from '../lib/apiError';
import type { CreateTransactionPayload } from '../types/transaction.types';

// Export type alias for compatibility with existing components
export type Transaction = TransactionFromApi;

export function useTransactions() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Obtenemos un límite amplio para el frontend por ahora,
      // idealmente se paginaría desde la vista (Infinite Scroll o similar)
      const data = await getTransactions(1, 100);
      setTransactions(data.transactions);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          logout();
          return;
        }
        setError(err.message);
      } else {
        setError('No se pudo cargar el historial de transacciones.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchTransactions is a stable callback ref; void-ing it in an effect is the established pattern across this codebase
    void fetchTransactions();
  }, [fetchTransactions]);

  // Actualización optimista cuando se realiza una transacción
  const addTransactionOptimistic = useCallback((tx: CreateTransactionPayload) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      desc: tx.type === 'buy'      ? `Compra de ${tx.currency_to} con saldo ${tx.currency_from}` :
            tx.type === 'sell'     ? `Venta de ${tx.currency_from} a saldo ${tx.currency_to}` :
            tx.type === 'exchange' ? `Conversión de saldo ${tx.currency_from} a ${tx.currency_to}` :
            tx.type === 'transfer_out' ? `Transferencia enviada` : `Transferencia recibida`,
    };

    setTransactions((prev) => [newTx, ...prev]);
  }, []);

  return { transactions, loading, error, refetch: fetchTransactions, addTransaction: addTransactionOptimistic };
}
