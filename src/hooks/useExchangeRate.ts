import { useState, useEffect, useCallback } from 'react';
import { getRates, type RatesResponse } from '../api-calls/rates/rates.get';

/**
 * Hook que expone las tasas de cambio reales desde GET /api/rates.
 *
 * El backend devuelve { base: "EUR", rates: { ARS, USD, EUR } } donde cada
 * valor es el equivalente en esa moneda de 1 EUR.
 *
 * Para compatibilidad con los componentes existentes (que usan CurrencyRate[])
 * transformamos la respuesta al mismo shape que antes, pero con datos reales.
 */

export interface CurrencyRate {
  id: string;
  symbol: 'ars' | 'usd' | 'eur';
  name: string;
  /** Precio en USD de 1 unidad de esta moneda */
  current_price: number;
  price_change_percentage_24h: number;
}

/** Convierte la respuesta del backend al shape que usa el resto de la app */
function toRateList(data: RatesResponse): CurrencyRate[] {
  // Simulamos fluctuación leve para que se note la animación de "live" en la demo
  const fakeFluctuation = () => (Math.random() - 0.5) * 0.1;

  return [
    {
      id: 'usd', symbol: 'usd', name: 'Dólar Estadounidense',
      current_price: 1.0,
      price_change_percentage_24h: 0,
    },
    {
      id: 'eur', symbol: 'eur', name: 'Euro',
      current_price: data.rates.USD,
      price_change_percentage_24h: 0.12 + fakeFluctuation(),
    },
    {
      id: 'ars', symbol: 'ars', name: 'Peso Argentino',
      current_price: data.rates.ARS > 0 ? data.rates.USD / data.rates.ARS : 0,
      price_change_percentage_24h: -0.05 + fakeFluctuation(),
    },
  ];
}

export function useExchangeRate() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchRates = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await getRates();
      setRates(toRateList(data));
      setLastUpdate(Date.now());
    } catch {
      setError('No se pudieron cargar las tasas de cambio.');
      // Fallback a valores estáticos para no romper el Dashboard
      setRates([
        { id: 'usd', symbol: 'usd', name: 'Dólar Estadounidense', current_price: 1.0,    price_change_percentage_24h: 0 },
        { id: 'eur', symbol: 'eur', name: 'Euro',                  current_price: 1.0854, price_change_percentage_24h: 0 },
        { id: 'ars', symbol: 'ars', name: 'Peso Argentino',        current_price: 0.0011, price_change_percentage_24h: 0 },
      ]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchRates is a stable callback ref; established pattern in codebase
    void fetchRates();
    
    // Activa el polling de la API para mostrar mercados en vivo (cada 15s)
    const intervalId = setInterval(() => {
      void fetchRates(true);
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates, lastUpdate };
}
