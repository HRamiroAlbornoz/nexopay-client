import { parseApiResponse } from '../../lib/apiError';

export interface CreateCheckoutPayload {
  amount: number;
  currency: 'ARS' | 'USD' | 'EUR';
  email: string;
  userId: string;
}

export async function createStripeCheckout(payload: CreateCheckoutPayload): Promise<{ url: string }> {
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    credentials: 'include', // Ensures the backend receives session if needed, though not strictly required for this endpoint yet
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseApiResponse(res);
}
