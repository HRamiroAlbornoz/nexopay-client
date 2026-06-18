import { describe, it, expect } from 'vitest';
import { toRateList } from '../../hooks/useExchangeRate';

describe('toRateList (currency conversion math)', () => {
  it('uses USD as the base currency with price 1.0', () => {
    const result = toRateList({ base: 'EUR', rates: { ARS: 1050.5, USD: 1.08, EUR: 1 } });
    const usd = result.find((r) => r.symbol === 'usd');
    expect(usd?.current_price).toBe(1.0);
  });

  it('prices EUR directly from rates.USD (1 EUR = rates.USD dollars)', () => {
    const result = toRateList({ base: 'EUR', rates: { ARS: 1050.5, USD: 1.08, EUR: 1 } });
    const eur = result.find((r) => r.symbol === 'eur');
    expect(eur?.current_price).toBe(1.08);
  });

  it('prices ARS as USD/ARS, not ARS/USD, so ARS stays far below 1 dollar', () => {
    const result = toRateList({ base: 'EUR', rates: { ARS: 1050.5, USD: 1.08, EUR: 1 } });
    const ars = result.find((r) => r.symbol === 'ars');
    expect(ars?.current_price).toBeCloseTo(1.08 / 1050.5, 10);
    expect(ars?.current_price).toBeLessThan(0.01);
  });

  it('returns 0 for ARS price instead of dividing by zero when rates.ARS is 0', () => {
    const result = toRateList({ base: 'EUR', rates: { ARS: 0, USD: 1.08, EUR: 1 } });
    const ars = result.find((r) => r.symbol === 'ars');
    expect(ars?.current_price).toBe(0);
    expect(Number.isFinite(ars?.current_price)).toBe(true);
  });
});
