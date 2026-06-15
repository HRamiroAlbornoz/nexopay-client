export type CurrencyCode = 'ARS' | 'USD' | 'EUR';

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  ARS: { code: 'ARS', name: 'Peso Argentino',       symbol: '$',  flag: '🇦🇷' },
  USD: { code: 'USD', name: 'Dólar Estadounidense',  symbol: '$',  flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro',                  symbol: '€',  flag: '🇪🇺' },
};

export const CURRENCIES: CurrencyCode[] = ['ARS', 'USD', 'EUR'];
