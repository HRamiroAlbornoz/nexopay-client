import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBuyTransaction } from '../../api-calls/transactions/transactions.post';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('transactions API wrappers', () => {
  it('createBuyTransaction resolves on success', async () => {
    const mockTx = {
      id: 'tx-1',
      type: 'buy',
      currency_from: 'ARS',
      currency_to: 'USD',
      amount_from: 1000,
      amount_to: 10,
      exchange_rate: 100,
      created_at: new Date().toISOString(),
    };

    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockTx),
    });

    const res = await createBuyTransaction({ currency_to: 'USD', amount_to: 10 });
    expect(res).toBeTruthy();
    expect(res.id).toBe('tx-1');
    expect(res.type).toBe('buy');
  });

  it('createBuyTransaction throws ApiError on 422', async () => {
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ code: 'INSUFFICIENT_BALANCE', message: 'Saldo insuficiente' }),
    });

    await expect(createBuyTransaction({ currency_to: 'USD', amount_to: 10 })).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
      status: 422,
    });
  });
});
