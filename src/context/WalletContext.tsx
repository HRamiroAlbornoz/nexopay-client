import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getWalletBalances } from '../api-calls/wallet/wallet.get';
import { ApiError } from '../lib/apiError';
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

export const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchBalances = useCallback(async () => {
    if (!user) {
      setBalances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getWalletBalances();
      setBalances(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized()) {
          // Sesión vencida — limpia estado y redirige a login
          logout();
          return;
        }
        setError(err.message);
      } else {
        setError('No se pudo cargar la billetera.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  // Carga inicial y recarga cuando cambia el usuario autenticado
  useEffect(() => {
    void fetchBalances();
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
