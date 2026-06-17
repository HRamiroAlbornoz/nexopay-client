import type { CurrencyCode } from './currency.types';

export type TransactionType = 'buy' | 'sell' | 'exchange' | 'transfer_in' | 'transfer_out';

export interface Transaction {
  id: string;
  type: TransactionType;
  currency_from: CurrencyCode;
  currency_to: CurrencyCode;
  amount_from: number;
  amount_to: number;
  exchange_rate: number;
  created_at: string;
  desc?: string | undefined;
}

export type CreateTransactionPayload = Omit<Transaction, 'id' | 'created_at'>;
