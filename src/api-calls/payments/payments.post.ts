import { z } from 'zod';
import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

const checkoutResponseSchema = z.object({
  url: z.string().url(),
});

export async function createCheckoutSession(payload: {
  amount: number;
  currency: 'ars';
}) {
  const res = await fetch(`${API_BASE_URL}/create-checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await parseApiResponse(res);
  return checkoutResponseSchema.parse(raw);
}
