import { parseApiResponse } from '../../lib/apiError';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Llama a la Vercel Serverless Function (/api/send-email)
 * para enviar correos transaccionales vía AWS SES.
 * El endpoint verifica la sesión con el backend de Railway automáticamente.
 */
export async function sendConfirmationEmail(payload: SendEmailPayload) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      credentials: 'include', // Necesario para que la Vercel Function reciba la cookie y valide la sesión
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await parseApiResponse(res);
  } catch (err) {
    // Los errores de email no deben bloquear la UX principal
    console.error('[EmailService] Falló el envío de correo:', err);
    throw err;
  }
}
