import { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage, type ChatMessage } from '../../api-calls/chatbot/chatbot.post';
import { ApiError } from '../../lib/apiError';
import './ChatWidget.css';

// ─── Types ────────────────────────────────────────
interface MessageWithMeta extends ChatMessage {
  id: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────
const INITIAL_MESSAGE: MessageWithMeta = {
  id: 'init',
  role: 'assistant',
  content:
    '¡Hola! 👋 Soy **Nexo**, tu asistente financiero de NexoPay. ¿En qué puedo ayudarte hoy?',
  timestamp: new Date(),
};

const QUICK_REPLIES = [
  '💰 Ver mi saldo',
  '📤 Hacer transferencia',
  '🎯 Metas de ahorro',
  '📊 Mis transacciones',
];

// ─── SVG Icons ────────────────────────────────────
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
      fill="currentColor"
    />
    <circle cx="8" cy="11" r="1" fill="#06080f" />
    <circle cx="12" cy="11" r="1" fill="#06080f" />
    <circle cx="16" cy="11" r="1" fill="#06080f" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none" />
  </svg>
);

const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Component ────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]           = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [isOnline, setIsOnline]   = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [messages, setMessages]   = useState<MessageWithMeta[]>([INITIAL_MESSAGE]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // ── Auto-scroll al último mensaje ──
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages, open]);

  // ── Focus en textarea al abrir ──
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 180);
      setShowBadge(false);
    }
  }, [open]);

  // ── Animación de entrada/salida del panel ──
  const handleToggle = useCallback(() => {
    if (!open) {
      setOpen(true);
      setPanelVisible(true);
    } else {
      setPanelVisible(false);
      setTimeout(() => setOpen(false), 220);
    }
  }, [open]);

  // ── Enviar mensaje ──
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: MessageWithMeta = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setIsOnline(true);

    try {
      const reply = await sendChatMessage(content);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch (error) {
      setIsOnline(true); // Mantener online por defecto para errores de negocio
      let errorMessage = '⚠️ Ocurrió un error inesperado. Intenta nuevamente.';

      if (error instanceof ApiError) {
        switch (error.code) {
          case 'CHAT_IN_PROGRESS':
            errorMessage = '⚠️ Ya hay un mensaje procesándose. Espera la respuesta por favor.';
            break;
          case 'TOO_MANY_REQUESTS':
            errorMessage = '⚠️ Has alcanzado el límite de 20 mensajes cada 15 minutos. Intenta más tarde.';
            break;
          case 'CHATBOT_BLOCKED':
            errorMessage = '⚠️ No pude responder eso, ¿podés reformularlo?';
            break;
          case 'CHATBOT_UNAVAILABLE':
            errorMessage = '⚠️ El asistente no está disponible en este momento, probá de nuevo en un rato.';
            setIsOnline(false);
            break;
          case 'VALIDATION_ERROR':
            errorMessage = '⚠️ El mensaje ingresado no es válido (vacío o demasiado largo).';
            break;
        }
      } else {
        setIsOnline(false);
        errorMessage = '⚠️ No pude conectarme al servidor. Verifica tu conexión e intenta de nuevo.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // ── Enter para enviar (Shift+Enter = salto de línea) ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ── Auto-resize textarea ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  return (
    <>
      {/* ── Chat Panel ── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Asistente virtual Nexo — NexoPay"
          aria-modal="true"
          className={`chat-panel ${panelVisible ? 'chat-panel-enter' : 'chat-panel-exit'}`}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-avatar">
                🤖
                <span className={`chat-header-status-dot ${isOnline ? '' : 'offline'}`} />
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name">Nexo — Asistente NexoPay</div>
                <div className={`chat-header-sub ${isOnline ? '' : 'offline'}`}>
                  <span className="chat-status-indicator" />
                  {isOnline ? 'En línea · Responde al instante' : 'Sin conexión'}
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-header-btn"
                onClick={handleToggle}
                aria-label="Minimizar chat"
                title="Minimizar"
              >
                <MinimizeIcon />
              </button>
              <button
                className="chat-header-btn close-btn"
                onClick={handleToggle}
                aria-label="Cerrar chat"
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Offline Banner */}
          {!isOnline && (
            <div className="chat-offline-banner">
              <span>⚡</span>
              Sin conexión — los mensajes no se envían
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isUser ? 'user' : 'bot'}`}
                >
                  {!isUser && (
                    <div className="chat-bubble-avatar" aria-hidden="true">🤖</div>
                  )}
                  <div className="chat-bubble">
                    {msg.content}
                    <span className="chat-bubble-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-typing-row">
                <div className="chat-bubble-avatar" aria-hidden="true">🤖</div>
                <div className="chat-typing-bubble" aria-label="Nexo está escribiendo">
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                  <span className="chat-dot" />
                </div>
              </div>
            )}

            {/* Quick replies — solo cuando el historial es corto */}
            {messages.length <= 2 && !loading && (
              <div className="chat-quick-replies" role="group" aria-label="Respuestas rápidas">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    className="chat-quick-chip"
                    onClick={() => void handleSend(q)}
                    aria-label={`Preguntar: ${q}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta... (Enter para enviar)"
              disabled={loading}
              aria-label="Escribe tu consulta al asistente"
              id="chat-input-field"
            />
            <button
              className="chat-send-btn"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              id="chat-send-button"
            >
              <SendIcon />
            </button>
          </div>

          {/* Footer */}
          <div className="chat-footer">
            Impulsado por <span>NexoPay AI</span> · Gemini
          </div>
        </div>
      )}

      {/* ── FAB Trigger ── */}
      <button
        id="chat-widget-fab"
        className={`chat-fab ${open ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual Nexo'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Asistente NexoPay"
      >
        {/* Pulse ring cuando está cerrado */}
        {!open && <span className="chat-fab-ring" aria-hidden="true" />}

        {/* Badge de notificación */}
        {!open && showBadge && (
          <span className="chat-fab-badge" aria-label="1 mensaje nuevo">1</span>
        )}

        {/* Logo/Icon */}
        <span className="chat-fab-logo" aria-hidden="true">
          {open ? <CloseIcon /> : <ChatIcon />}
        </span>

        {/* Tooltip */}
        <span className="chat-fab-tooltip" role="tooltip">
          {open ? 'Cerrar chat' : '¿Necesitas ayuda?'}
        </span>
      </button>
    </>
  );
}
