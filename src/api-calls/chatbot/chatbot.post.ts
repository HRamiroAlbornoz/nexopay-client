import { API_BASE_URL } from '../../lib/apiConfig';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * POST /api/chatbot
 * Envía un mensaje al asistente virtual de NexoPay.
 * El historial de conversación se pasa completo para mantener contexto.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/chatbot`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Error ${res.status}`);
  }

  const data = (await res.json()) as { reply?: string; message?: string };
  return data.reply ?? data.message ?? 'Sin respuesta del asistente.';
}
