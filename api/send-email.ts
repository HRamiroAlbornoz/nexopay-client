import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { z } from 'zod';

// Esquema de validación del payload
const emailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
});

const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Solo se acepta POST' });
  }

  // Validar con Zod
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido',
      details: parsed.error.issues,
    });
  }

  const { to, subject, html } = parsed.data;
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!fromEmail) {
    return res.status(500).json({ code: 'CONFIG_ERROR', message: 'SES_FROM_EMAIL no configurado' });
  }

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    });

    await ses.send(command);
    return res.status(200).json({ ok: true, message: `Email enviado a ${to}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al enviar email';
    console.error('[send-email]', err);
    return res.status(500).json({ code: 'SES_ERROR', message });
  }
}
