import { describe, it, expect } from 'vitest';
import { ApiError, parseApiResponse } from '../../lib/apiError';

function fakeResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('parseApiResponse', () => {
  it('returns the parsed JSON body when the response is ok', async () => {
    const result = await parseApiResponse(fakeResponse(true, 200, { id: 'w1', amount: 100 }));
    expect(result).toEqual({ id: 'w1', amount: 100 });
  });

  it('throws an ApiError carrying code, message, status and details from the backend error contract', async () => {
    const errorBody = { code: 'INSUFFICIENT_BALANCE', message: 'Saldo insuficiente', details: { available: 50 } };
    await expect(parseApiResponse(fakeResponse(false, 422, errorBody))).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
      message: 'Saldo insuficiente',
      status: 422,
      details: { available: 50 },
    });
  });

  it('falls back to a generic message when the error body has no message field', async () => {
    await expect(parseApiResponse(fakeResponse(false, 500, {}))).rejects.toMatchObject({
      message: 'Error 500',
      status: 500,
    });
  });
});

describe('ApiError.isUnauthorized', () => {
  it('returns true only when status is 401', () => {
    const unauthorized = new ApiError({ message: 'Sesión vencida', status: 401 });
    const forbidden = new ApiError({ message: 'Sin permisos', status: 403 });
    expect(unauthorized.isUnauthorized()).toBe(true);
    expect(forbidden.isUnauthorized()).toBe(false);
  });
});
