// ─── Llamada al asistente Nexo de NexoPay ────────────────────────────────────
//
// Envía mensajes directamente al backend real en `${API_BASE_URL}/chatbot`.
// El backend se encarga de la verificación de sesión y de construir el contexto.
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
 * @param message  - Último mensaje escrito por el usuario
 * @returns        - Respuesta de texto generada por Nexo
 */
export async function sendChatMessage(message: string): Promise<string> {
  const respuesta = await fetch(`${API_BASE_URL}/chatbot`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ message }),
  });

  const datos = (await parseApiResponse(respuesta)) as { reply?: string; message?: string };
  return datos.reply ?? datos.message ?? 'Sin respuesta del asistente.';
}
