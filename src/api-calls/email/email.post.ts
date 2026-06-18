import { parseApiResponse } from '../../lib/apiError';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * POST /api/send-email
 * Llama a la Vercel Function que envía el email vía AWS SES.
 * La función verifica la sesión reenviando la cookie al backend real.
 */
export async function sendConfirmationEmail(payload: SendEmailPayload): Promise<void> {
  const res = await fetch('/api/send-email', {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });

  await parseApiResponse(res);
}
