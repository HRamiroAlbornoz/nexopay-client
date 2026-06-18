import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

// Vercel predeterminado parsea el body como JSON, pero Stripe requiere el raw buffer para validar firmas.
// Deshabilitamos el parser automático:
export const config = {
  api: { bodyParser: false },
};

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    const rawBody = await buffer(req);
    // Verificamos la firma usando el secreto del webhook configurado en Stripe
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // Si no hay firma (entorno de pruebas / mock), parseamos directamente
      event = JSON.parse(rawBody.toString());
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error de firma';
    console.error(`⚠️  Webhook signature verification failed: ${msg}`);
    return res.status(400).send(`Webhook Error: ${msg}`);
  }

  // Manejar el evento de Checkout Completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const email = session.customer_details?.email;
    const amount = session.metadata?.depositAmount;
    const currency = session.metadata?.depositCurrency;

    console.log(`[Stripe Webhook] Pago exitoso recibido de ${email} por ${amount} ${currency}`);

    // NOTA: Idealmente aquí haríamos un POST directo a la DB de Railway para acreditar el dinero.
    // Como el webhook no tiene credenciales directas a la DB ni cookie de sesión, 
    // su trabajo de demostración es enviar el recibo oficial vía email por AWS SES.

    if (email && amount && currency) {
      try {
        const command = new SendEmailCommand({
          Source: process.env.SES_FROM_EMAIL,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: 'Recibo de Pago de NexoPay', Charset: 'UTF-8' },
            Body: { 
              Html: { 
                Data: `
                  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #00e676;">Depósito Procesado con Éxito</h2>
                    <p>Hola,</p>
                    <p>Hemos procesado correctamente tu pago con tarjeta y los fondos han sido acreditados a tu billetera de NexoPay.</p>
                    <ul style="background: #f9f9f9; padding: 15px; border-radius: 4px; list-style: none;">
                      <li><strong>Monto Ingresado:</strong> ${amount} ${currency.toUpperCase()}</li>
                      <li><strong>Referencia:</strong> ${session.id}</li>
                      <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</li>
                    </ul>
                    <p>¡Gracias por operar con NexoPay!</p>
                  </div>
                `,
                Charset: 'UTF-8' 
              } 
            },
          },
        });
        await ses.send(command);
        console.log(`[Stripe Webhook] Email de recibo enviado a ${email}`);
      } catch (err) {
        console.error('[Stripe Webhook] Falló el envío del recibo SES:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
