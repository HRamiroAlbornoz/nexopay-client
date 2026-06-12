import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface WalletBalance {
  currency_code: 'ARS' | 'USD' | 'EUR';
  amount: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  balances: WalletBalance[];
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // 1. Create a route `GET /api/wallet` that checks req.user.id and returns or creates the user's wallet.
  // 2. Create a route `GET /api/wallet/balances` that returns all active balances for the wallet.
  // 3. Create a route `POST /api/wallet/balances/deposit` that takes { currency_code, amount } and increments the balance.
  // 4. Protect all these routes using requireAuth middleware to prevent unauthorized balance manipulation.

  useEffect(() => {
    if (!user) return;

    // Simulate fetching wallet data from PostgreSQL backend for the active user
    // Only active currencies are ARS, USD, and EUR as specified in backend seed migrations.
    const timer = setTimeout(() => {
      setWallet({
        id: 'w4cae933-c80b-4a51-991d-795bcf54eb6d',
        user_id: user.id,
        balances: [
          { currency_code: 'ARS', amount: user.email === 'richard@nexopay.com' ? 80000 : 150000 },
          { currency_code: 'USD', amount: user.email === 'richard@nexopay.com' ? 200 : 500 },
          { currency_code: 'EUR', amount: user.email === 'richard@nexopay.com' ? 150 : 300 },
        ],
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const simulateDeposit = async (currency: 'ARS' | 'USD' | 'EUR', amount: number) => {
    setError('');
    // Propose backend request in comments:
    // await fetch('/api/wallet/balances/deposit', { method: 'POST', body: JSON.stringify({ currency, amount }) })
    
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

  return { wallet, loading, error, simulateDeposit };
}
