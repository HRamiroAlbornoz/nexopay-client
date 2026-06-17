import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, type ChatMessage } from '../../api-calls/chatbot/chatbot.post';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: '¡Hola! Soy el asistente de NexoPay 👋 ¿En qué puedo ayudarte hoy? Puedo responder preguntas sobre tus finanzas, transferencias, metas de ahorro y más.',
};

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [history, open]);

  // Focus en input al abrir
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setHistory((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(trimmed, history);
      setHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      // Fallback local si el backend no responde
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, no pude conectarme al servidor en este momento. Por favor, intenta más tarde.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {/* Panel de chat */}
      {open && (
        <div
          role="dialog"
          aria-label="Asistente virtual NexoPay"
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: 'min(360px, calc(100vw - 48px))',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10, 12, 20, 0.92)',
            border: '1px solid rgba(243, 186, 47, 0.2)',
            borderRadius: 16,
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(24px)',
            zIndex: 9998,
            overflow: 'hidden',
            animation: 'chatSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15,18,28,0.6)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg,#f3ba2f,#dca018)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: '#fff' }}>Asistente NexoPay</div>
                <div style={{ fontSize: 11, color: '#00e676', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block' }} />
                  En línea
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
                color: '#8a99ad', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg,#f3ba2f,#dca018)'
                      : 'rgba(255,255,255,0.06)',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    color: isUser ? '#06080f' : '#e8eaf0',
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontWeight: isUser ? 700 : 400,
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '14px 14px 14px 4px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#f3ba2f', opacity: 0.7,
                      animation: `chatDot 1.2s ${delay}ms infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 10,
            flexShrink: 0,
            background: 'rgba(10,12,20,0.5)',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              disabled={loading}
              aria-label="Escribe tu consulta al asistente"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '9px 14px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#f3ba2f,#dca018)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, opacity: loading || !input.trim() ? 0.4 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
        title="Asistente NexoPay"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: open
            ? 'rgba(10,12,20,0.9)'
            : 'linear-gradient(135deg,#f3ba2f,#dca018)',
          border: open ? '1px solid rgba(243,186,47,0.4)' : 'none',
          boxShadow: '0 8px 28px rgba(243,186,47,0.3)',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          color: open ? '#f3ba2f' : '#06080f',
        }}
      >
        {open ? '×' : '💬'}
      </button>

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1;   }
        }
      `}</style>
    </>
  );
}
