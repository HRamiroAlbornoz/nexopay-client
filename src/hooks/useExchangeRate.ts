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
  // El backend devuelve las tasas relativas al EUR.
  // USD/EUR = data.rates.USD  →  1 USD = 1/data.rates.USD EUR
  // Para current_price usamos "cuánto vale 1 unidad de esta moneda en USD"
  const usdPerEur = data.rates.USD > 0 ? 1 / data.rates.USD : 1;

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
      current_price: usdPerEur,
      price_change_percentage_24h: 0,
    },
    {
      id: 'ars',
      symbol: 'ars',
      name: 'Peso Argentino',
      current_price: data.rates.ARS > 0 ? usdPerEur / data.rates.ARS : 0,
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
      // Fallback a valores estáticos para no romper el Dashboard
      setRates([
        { id: 'usd', symbol: 'usd', name: 'Dólar Estadounidense', current_price: 1.0,    price_change_percentage_24h: 0 },
        { id: 'eur', symbol: 'eur', name: 'Euro',                  current_price: 1.0854, price_change_percentage_24h: 0 },
        { id: 'ars', symbol: 'ars', name: 'Peso Argentino',        current_price: 0.0011, price_change_percentage_24h: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchRates is a stable callback ref; established pattern in codebase
    void fetchRates();
  }, [fetchRates]);

  return { rates, loading, error, refetch: fetchRates };
}
