import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Wallet, WalletBalance } from '../types/wallet.types';
import type { CurrencyCode } from '../types/currency.types';

export interface WalletContextValue {
  wallet: Wallet | null;
  setWallet: React.Dispatch<React.SetStateAction<Wallet | null>>;
  loading: boolean;
  error: string;
  simulateDeposit: (currency: CurrencyCode, amount: number) => Promise<boolean>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    // Mock mientras el backend no tenga GET /api/wallet.
    // Cuando Hernán habilite la ruta, reemplazar con:
    //   const res = await fetch(`${API_BASE_URL}/wallet`, { credentials: 'include' });
    //   const data = await res.json();
    //   setWallet(walletSchema.parse(data));
    const timer = setTimeout(() => {
      const balances: WalletBalance[] = [
        { currency_code: 'ARS', amount: user.email === 'richard@nexopay.com' ? 80000  : 150000 },
        { currency_code: 'USD', amount: user.email === 'richard@nexopay.com' ? 200    : 500    },
        { currency_code: 'EUR', amount: user.email === 'richard@nexopay.com' ? 150    : 300    },
      ];
      setWallet({ id: 'w4cae933-c80b-4a51-991d-795bcf54eb6d', user_id: user.id, balances });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const simulateDeposit = async (currency: CurrencyCode, amount: number): Promise<boolean> => {
    setError('');
    setWallet((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        balances: prev.balances.map((b) =>
          b.currency_code === currency ? { ...b, amount: b.amount + amount } : b
        ),
      };
    });
    return true;
  };

  return (
    <WalletContext.Provider value={{ wallet, setWallet, loading, error, simulateDeposit }}>
      {children}
    </WalletContext.Provider>
  );
}
