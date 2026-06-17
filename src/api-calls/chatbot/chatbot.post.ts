// ─── Llamada al asistente Nexo de NexoPay ────────────────────────────────────
//
// En producción (Vercel):  POST /api/chatbot  →  Vercel Function (api/chatbot.ts)
// En desarrollo local:     POST /api/chatbot  →  proxy Vite → Railway backend
//
// La Vercel Function se encarga de:
//   • Prompt del sistema financiero NexoPay
//   • Gemini 2.5 Flash con temperatura 0.4
//   • Límite de solicitudes por IP
//   • Verificación de sesión contra Railway (/auth/me)
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from '../../lib/apiConfig';
import { parseApiResponse } from '../../lib/apiError';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Envía un mensaje al asistente Nexo de NexoPay.
 *
 * El historial completo de la conversación se pasa en cada llamada
 * para que Gemini mantenga el contexto de forma stateless.
 *
 * @param message  - Último mensaje escrito por el usuario
 * @param history  - Historial previo (no incluye el mensaje actual)
 * @returns        - Respuesta de texto generada por Nexo
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const respuesta = await fetch(`${API_BASE_URL}/chatbot`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ message, history }),
  });

  const datos = (await parseApiResponse(respuesta)) as { reply?: string; message?: string };
  return datos.reply ?? datos.message ?? 'Sin respuesta del asistente.';
}
