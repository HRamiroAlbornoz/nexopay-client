import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock'; // Mock para evitar fallos si no se configura
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Solo se acepta POST' });
  }

  try {
    const { amount, currency, email, userId } = req.body;

    if (!amount || amount <= 0 || !currency || !email) {
      return res.status(400).json({ code: 'INVALID_PAYLOAD', message: 'Faltan datos (amount, currency, email)' });
    }

    // 1. Verificación básica: Si no hay llave real configurada, mandamos una URL simulada (Modo Demo)
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[Stripe] STRIPE_SECRET_KEY no configurada. Usando modo simulación.');
      // Simulamos la redirección como si Stripe hubiera sido exitoso
      const origin = req.headers.origin || 'http://localhost:5173';
      const mockSessionId = `cs_test_mock_${Date.now()}`;
      return res.status(200).json({ url: `${origin}/dashboard?session_id=${mockSessionId}&mock=true` });
    }

    // 2. Creación de la sesión real en Stripe
    const origin = req.headers.origin || 'https://nexopay-client.vercel.app';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Depósito a Billetera NexoPay',
              description: `Carga de saldo en ${currency.toUpperCase()}`,
              images: ['https://nexopay-client.vercel.app/logo-dark.png'], // Idealmente logo real
            },
            // Stripe maneja montos en la unidad menor (centavos)
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      metadata: {
        userId: userId || 'unknown',
        depositAmount: amount.toString(),
        depositCurrency: currency,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al crear sesión de Stripe';
    console.error('[Stripe Error]', msg);
    return res.status(500).json({ code: 'STRIPE_ERROR', message: msg });
  }
}
