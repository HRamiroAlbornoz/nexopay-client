import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getWalletBalances } from '../api-calls/wallet/wallet.get';
import { handleApiError } from '../lib/handleApiError';
import type { WalletBalance } from '../api-calls/wallet/wallet.get';
import type { CurrencyCode } from '../types/currency.types';

// ─── Tipos del contexto ───────────────────────────────────────────────────────

export interface WalletContextValue {
  balances:    WalletBalance[];
  loading:     boolean;
  error:       string;
  refetch:     () => Promise<void>;
  /** Actualiza optimistamente un balance local tras una transacción exitosa. */
  updateBalance: (currency: CurrencyCode, delta: number) => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- Context and Provider are intentionally co-located; Vite HMR limitation
export const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchBalances = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setBalances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getWalletBalances(signal);
      setBalances(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Sesión vencida — limpia estado y redirige a login
      handleApiError(err, setError, 'No se pudo cargar la billetera.', logout);
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchBalances(controller.signal);
    return () => controller.abort();
  }, [fetchBalances]);

  const updateBalance = useCallback((currency: CurrencyCode, delta: number) => {
    setBalances((prev) =>
      prev.map((b) =>
        b.currency_code === currency ? { ...b, amount: b.amount + delta } : b
      )
    );
  }, []);

  return (
    <WalletContext.Provider value={{ balances, loading, error, refetch: fetchBalances, updateBalance }}>
      {children}
    </WalletContext.Provider>
  );
}
