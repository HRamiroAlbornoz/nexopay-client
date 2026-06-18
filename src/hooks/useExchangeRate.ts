import { useState, useEffect, useCallback } from 'react';
import { getRates, type RatesResponse } from '../api-calls/rates/rates.get';

export interface CurrencyRate {
  id: string;
  symbol: 'ars' | 'usd' | 'eur';
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

function toRateList(data: RatesResponse): CurrencyRate[] {
  return [
    {
      id: 'usd',
      symbol: 'usd',
      name: 'Dólar Estadounidense',
      current_price: 1.0,
      price_change_percentage_24h: 0,
    },
    {
      id: 'eur',
      symbol: 'eur',
      name: 'Euro',
      current_price: data.rates.USD,
      price_change_percentage_24h: 0,
    },
    {
      id: 'ars',
      symbol: 'ars',
      name: 'Peso Argentino',
      current_price: data.rates.ARS > 0 ? data.rates.USD / data.rates.ARS : 0,
      price_change_percentage_24h: 0,
    },
  ];
}

export function useExchangeRate() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRates();
      setRates(toRateList(data));
    } catch {
      setError('No se pudieron cargar las tasas de cambio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchRates es un callback estable; patrón establecido en useTransactions/useWallet
    void fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates };
}
