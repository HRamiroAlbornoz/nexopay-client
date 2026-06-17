import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';
import type { CurrencyCode } from '../../types/currency.types';

const transactionResponseSchema = z.object({
  id: z.string(),
  type: z.enum(['buy', 'sell', 'exchange', 'transfer_in', 'transfer_out']),
  currency_from: z.enum(['ARS', 'USD', 'EUR']),
  currency_to: z.enum(['ARS', 'USD', 'EUR']),
  amount_from: z.number(),
  amount_to: z.number(),
  exchange_rate: z.number(),
  created_at: z.string(),
  desc: z.string().optional(),
});

async function postTransaction(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/transactions/${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw: unknown = await parseApiResponse(res);
  return transactionResponseSchema.parse(raw);
}

/**
 * POST /api/transactions/buy
 * Compra de divisa: descuenta ARS y acredita la moneda destino.
 */
export async function createBuyTransaction(payload: {
  currency_to: CurrencyCode;
  amount_to: number;
}) {
  return postTransaction('buy', payload);
}

/**
 * POST /api/transactions/sell
 * Venta de divisa: descuenta la moneda origen y acredita ARS.
 */
export async function createSellTransaction(payload: {
  currency_from: CurrencyCode;
  amount_from: number;
}) {
  return postTransaction('sell', payload);
}

/**
 * POST /api/transactions/exchange
 * Conversión entre divisas: descuenta currency_from y acredita currency_to.
 */
export async function createExchangeTransaction(payload: {
  currency_from: CurrencyCode;
  currency_to: CurrencyCode;
  amount_from: number;
}) {
  return postTransaction('exchange', payload);
}

/**
 * POST /api/wallet/transfer
 * Transferencia a otro usuario por correo electrónico.
 */
export async function createTransfer(payload: {
  recipient_email: string;
  currency_code: CurrencyCode;
  amount: number;
}) {
  const res = await fetch(`${API_BASE_URL}/wallet/transfer`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw: unknown = await parseApiResponse(res);
  const transferResponseSchema = z.object({ ok: z.boolean() });
  return transferResponseSchema.parse(raw);
}
