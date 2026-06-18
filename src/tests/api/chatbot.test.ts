import { describe, it, expect, vi } from 'vitest';
import { sendChatMessage } from '../../api-calls/chatbot/chatbot.post';

describe('chatbot API wrapper', () => {
  it('sendChatMessage returns reply when API responds 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ reply: 'Hola, soy Nexo.' }),
    }));

    const reply = await sendChatMessage('Hola');
    expect(reply).toBe('Hola, soy Nexo.');
  });

  it('sendChatMessage throws ApiError on rate limit 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }),
    }));

    await expect(sendChatMessage('Hola')).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', status: 429 });
  });
});
