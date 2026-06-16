import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { z } from 'zod';

// ─── Esquema de validación del payload ───────────────────────────────────────
const emailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
});

// ─── Cliente SES ──────────────────────────────────────────────────────────────
const ses = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

// ─── Rate limiting en memoria por IP ─────────────────────────────────────────
// Nota: en Vercel Serverless cada instancia tiene su propia memoria.
// Este rate limiter es una primera línea de defensa contra ráfagas desde
// una misma IP dentro de la misma instancia activa. Para producción de
// escala alta se recomienda reemplazar con Upstash Redis + @upstash/ratelimit.
const RATE_LIMIT_MAX      = 5;    // máximo de requests por IP
const RATE_LIMIT_WINDOW   = 60_000; // ventana de 60 segundos en ms

interface RateLimitRecord {
  count:     number;
  windowStart: number;
}

const ipCounters = new Map<string, RateLimitRecord>();

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const record = ipCounters.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    // Nueva ventana
    ipCounters.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count += 1;
  return false;
}

// ─── Verificación de sesión contra el backend de Railway ─────────────────────
// La Vercel Function no comparte contexto con Express/Railway, por lo que
// reenviamos la cookie de sesión al endpoint /auth/me del backend para
// validar que el llamador tiene una sesión activa y legítima.
async function verifySession(cookieHeader: string | undefined): Promise<boolean> {
  const backendBase = process.env.VITE_APP_API_BASE ?? process.env.BACKEND_API_BASE;

  if (!backendBase) {
    // Si no hay URL de backend configurada, rechazamos por seguridad (fail-safe).
    console.error('[send-email] BACKEND_API_BASE / VITE_APP_API_BASE no configurado.');
    return false;
  }

  try {
    const response = await fetch(`${backendBase}/auth/me`, {
      method:  'GET',
      headers: {
        // Reenviar la cookie de sesión al backend tal como llegó
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      // 3 segundos de timeout para no bloquear la respuesta al cliente
      signal: AbortSignal.timeout(3_000),
    });

    return response.ok; // 200 = sesión válida, cualquier otro código = no autenticado
  } catch (err) {
    console.error('[send-email] Error al verificar sesión con el backend:', err);
    return false; // En caso de error de red también rechazamos (fail-safe)
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Solo se acepta POST' });
  }

  // 2. Rate limiting por IP (primera línea de defensa)
  const clientIp =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      code:    'RATE_LIMIT_EXCEEDED',
      message: `Demasiadas solicitudes desde esta IP. Máximo ${RATE_LIMIT_MAX} por minuto.`,
    });
  }

  // 3. Verificación de sesión — el llamador debe tener una sesión válida en Railway
  const cookieHeader = req.headers['cookie'];
  const sessionValid = await verifySession(cookieHeader);

  if (!sessionValid) {
    return res.status(401).json({
      code:    'UNAUTHORIZED',
      message: 'Debes iniciar sesión para enviar emails.',
    });
  }

  // 4. Validar payload con Zod
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code:    'VALIDATION_ERROR',
      message: 'Payload inválido',
      details: parsed.error.issues,
    });
  }

  const { to, subject, html } = parsed.data;
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!fromEmail) {
    return res.status(500).json({ code: 'CONFIG_ERROR', message: 'SES_FROM_EMAIL no configurado' });
  }

  // 5. Enviar email via AWS SES
  try {
    const command = new SendEmailCommand({
      Source:      fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body:    { Html:    { Data: html,    Charset: 'UTF-8' } },
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
