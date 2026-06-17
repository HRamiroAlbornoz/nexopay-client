import type { CurrencyCode } from './currency.types';

export interface WalletBalance {
  currency_code: CurrencyCode;
  amount: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  balances: WalletBalance[];
}
