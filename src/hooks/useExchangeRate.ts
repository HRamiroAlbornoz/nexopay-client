import { useState, useEffect, useCallback } from 'react';
import { getRates, type RatesResponse } from '../api-calls/rates/rates.get';

export interface CurrencyRate {
  id: string;
  symbol: 'ars' | 'usd' | 'eur';
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export function toRateList(data: RatesResponse): CurrencyRate[] {
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

/** Intervalo de refresco automático (debe coincidir con el TTL de la caché). */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

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
    } catch (err) {
      console.error('No se pudieron cargar las tasas de cambio.', err);
      setError('No se pudieron cargar las tasas de cambio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial
    void fetchRates();

    // Auto-refresh cada 5 minutos — muestra datos actualizados en el panel
    // "Mercados en vivo" sin que el usuario recargue la página.
    const intervalId = setInterval(() => {
      void fetchRates();
    }, REFRESH_INTERVAL_MS);

    // Cleanup: cancela el intervalo cuando el componente se desmonta
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates };
}

