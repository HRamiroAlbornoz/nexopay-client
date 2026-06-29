import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getTransactions, type TransactionFromApi } from '../api-calls/transactions/transactions.get';
import { handleApiError } from '../lib/handleApiError';
import type { CreateTransactionPayload } from '../types/transaction.types';

// Export type alias for compatibility with existing components
export type Transaction = TransactionFromApi;

export function useTransactions() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(async (signal?: AbortSignal) => {
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
      const data = await getTransactions(1, 100, signal);
      setTransactions(data.transactions);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      handleApiError(err, setError, 'No se pudo cargar el historial de transacciones.', logout);
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchTransactions(controller.signal);
    return () => controller.abort();
  }, [fetchTransactions]);

  // Actualización optimista cuando se realiza una transacción
  const addTransactionOptimistic = useCallback((tx: CreateTransactionPayload) => {
    const newTx: Transaction = {
      ...tx,
      id: `optimistic-${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      desc: tx.type === 'buy'          ? `Compra de ${tx.currency_to} con saldo ${tx.currency_from}` :
            tx.type === 'sell'         ? `Venta de ${tx.currency_from} a saldo ${tx.currency_to}` :
            tx.type === 'exchange'     ? `Conversión de saldo ${tx.currency_from} a ${tx.currency_to}` :
            tx.type === 'transfer_out' ? `Transferencia enviada` : `Transferencia recibida`,
    };

    setTransactions((prev) => [newTx, ...prev]);
  }, []);

  return { transactions, loading, error, refetch: fetchTransactions, addTransaction: addTransactionOptimistic };
}
