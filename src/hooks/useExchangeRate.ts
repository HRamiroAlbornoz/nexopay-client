import { useState, useEffect } from 'react';

export interface CurrencyRate {
  id: string;
  symbol: 'ars' | 'usd' | 'eur';
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export function useExchangeRate() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  // IMPORTANT BACKEND TODO FOR HERNÁN ALBORNOZ:
  // 1. Create a route `GET /api/rates` that calls Frankfurter API (already stubbed in nexopay-api/src/api-calls)
  //    and returns live quotes for ARS, USD, and EUR.

  useEffect(() => {
    // Simulated live rates feed restricted only to active currencies: ARS, USD, EUR
    const timer = setTimeout(() => {
      setRates([
        {
          id: '1',
          symbol: 'usd',
          name: 'Dólar Estadounidense',
          current_price: 1.0,
          price_change_percentage_24h: 0.15,
        },
        {
          id: '2',
          symbol: 'eur',
          name: 'Euro',
          current_price: 1.0854,
          price_change_percentage_24h: -0.32,
        },
        {
          id: '3',
          symbol: 'ars',
          name: 'Peso Argentino',
          current_price: 0.0011, // $904.50 pesos per dollar
          price_change_percentage_24h: 1.25,
        },
      ]);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return { rates, loading };
}
