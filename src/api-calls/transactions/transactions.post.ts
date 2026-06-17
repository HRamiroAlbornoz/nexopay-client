import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';
import type { CurrencyCode } from '../../types/currency.types';

// ─── Esquema de respuesta de transacción ────────────────────────────────────

const transactionResponseSchema = z.object({
  id:            z.string(),
  type:          z.enum(['buy', 'sell', 'exchange', 'transfer_in', 'transfer_out']),
  currency_from: z.enum(['ARS', 'USD', 'EUR']),
  currency_to:   z.enum(['ARS', 'USD', 'EUR']),
  amount_from:   z.number(),
  amount_to:     z.number(),
  exchange_rate: z.number(),
  created_at:    z.string(),
  desc:          z.string().optional(),
});

// Helper interno reutilizable
async function postTransaction(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE_URL}/transactions/${endpoint}`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(body),
  });

  const raw = await parseApiResponse(res);
  return transactionResponseSchema.parse(raw);
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/**
 * POST /api/transactions/buy
 * Compra de divisa: descuenta ARS (amount_from) y acredita la moneda destino.
 * Body: { currency_to: "USD"|"EUR", amount_from: number }
 */
export async function createBuyTransaction(payload: {
  currency_to: Exclude<CurrencyCode, 'ARS'>;
  amount_from: number; // monto en ARS a debitar
}) {
  return postTransaction('buy', payload);
}

/**
 * POST /api/transactions/sell
 * Venta de divisa: descuenta la moneda origen y acredita ARS.
 * Body: { currency_from: "USD"|"EUR", amount_from: number }
 */
export async function createSellTransaction(payload: {
  currency_from: Exclude<CurrencyCode, 'ARS'>;
  amount_from:   number;
}) {
  return postTransaction('sell', payload);
}

/**
 * POST /api/transactions/exchange
 * Conversión entre divisas distintas.
 * Body: { currency_from, currency_to, amount_from }
 */
export async function createExchangeTransaction(payload: {
  currency_from: CurrencyCode;
  currency_to:   CurrencyCode;
  amount_from:   number;
}) {
  return postTransaction('exchange', payload);
}

/**
 * POST /api/transactions/transfer
 * Transferencia a otro usuario por correo electrónico.
 * Body: { recipient_email, currency_code, amount }
 * Respuesta: { transaction } — se valida completa con Zod.
 */
export async function createTransfer(payload: {
  recipient_email: string;
  currency_code:   CurrencyCode;
  amount:          number;
}) {
  const res = await fetch(`${API_BASE_URL}/transactions/transfer`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });

  const raw = await parseApiResponse(res);
  // El backend devuelve { transaction: {...} }
  const wrapper = z.object({ transaction: transactionResponseSchema }).parse(raw);
  return wrapper.transaction;
}
