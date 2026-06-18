// ─── Llamada al asistente Nexo de NexoPay ────────────────────────────────────
//
// Endpoint: POST /api/chatbot  (Railway backend)
//
// El backend gestiona el contexto de forma stateless con Gemini:
//   • Solo necesita el mensaje actual del usuario.
//   • El system prompt, el contexto financiero (balances, tasas, etc.) y las
//     reglas anti-prompt-injection las maneja el backend internamente.
//   • No es streaming — una sola request/response.
//
// Rate limits del backend (por usuario autenticado):
//   • Máximo 20 mensajes cada 15 minutos → 429 TOO_MANY_REQUESTS
//   • Solo 1 mensaje en vuelo a la vez   → 429 CHAT_IN_PROGRESS
//
// El frontend debe deshabilitar el input/botón mientras espera la respuesta
// para evitar chocar con CHAT_IN_PROGRESS en el uso normal.
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
 * El backend acepta únicamente `{ message: string }` (1-500 caracteres).
 * El contexto de la conversación lo gestiona el backend de forma stateless.
 *
 * @param message - Mensaje escrito por el usuario (max 500 caracteres)
 * @returns       - Respuesta de texto generada por Nexo
 */
export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chatbot`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ message }),
  });

  const data = (await parseApiResponse(response)) as { reply?: string };
  return data.reply ?? 'Sin respuesta del asistente.';
}
