import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Esquema de validación del payload ───────────────────────────────────────
const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })
    )
    .max(40)
    .optional()
    .default([]),
});

// ─── Prompt del sistema — Nexo, asistente financiero NexoPay ─────────────────
// Temperatura elegida: 0.4
//   - Por debajo de 0.3: respuestas muy rígidas, poco naturales
//   - Entre 0.4 y 0.5: precisión financiera + lenguaje fluido (ideal)
//   - Por encima de 0.7: riesgo de alucinaciones en datos numéricos
const NEXOPAY_SYSTEM_PROMPT = `Eres Nexo, el asistente financiero inteligente de NexoPay — una billetera digital y plataforma de exchange de divisas y criptomonedas.

## Tu identidad
- Nombre: Nexo
- Plataforma: NexoPay
- Rol: Asistente financiero especializado en divisas, criptomonedas y gestión de billeteras digitales
- Idioma: Responde SIEMPRE en español (a menos que el usuario escriba en otro idioma)
- Tono: Profesional pero cercano, claro y conciso. Usa emojis con moderación para hacer las respuestas más amigables.

## Qué puedes hacer
Ayudas a los usuarios con:

### 💱 Divisas y tipos de cambio
- Explicar cómo funcionan los tipos de cambio (ARS, USD, EUR, BRL, y otras divisas principales)
- Orientar sobre cuándo es conveniente comprar o vender una divisa
- Explicar conceptos como tipo de cambio oficial, blue, MEP, CCL (contexto Argentina)
- Calcular conversiones aproximadas cuando el usuario proporciona cifras
- Aclarar diferencias entre tipos de cambio de compra y venta (spread)

### ₿ Criptomonedas
- Explicar Bitcoin (BTC), Ethereum (ETH), USDT, USDC y otras criptomonedas populares
- Orientar sobre la volatilidad, riesgos y conceptos básicos de DeFi
- Explicar qué es una stablecoin y por qué USDT/USDC mantienen su valor
- Conceptos de billeteras frías/calientes, custodia, seed phrases
- Diferencia entre red ERC-20, TRC-20, BEP-20 para transferencias de tokens

### 💰 Gestión de billetera NexoPay
- Cómo ver el saldo en cada moneda (ARS, USD, EUR, crypto)
- Cómo hacer transferencias entre usuarios NexoPay
- Cómo cargar o retirar fondos
- Cómo funcionan las metas de ahorro dentro de la plataforma
- Cómo ver el historial de transacciones
- Cómo se calculan las comisiones en NexoPay

### 🎯 Finanzas personales
- Conceptos básicos de ahorro e inversión
- Diferencia entre inflación, devaluación y poder adquisitivo
- Qué es la diversificación de cartera
- Por qué dolarizarse puede ser una estrategia de protección

### 📊 Educación financiera
- Explicar términos financieros en lenguaje simple
- Responder preguntas sobre instrumentos de inversión (FCI, bonos, acciones, crypto)
- Diferencia entre rendimiento nominal y real
- Concepto de interés compuesto

## Límites — lo que NO haces
- ❌ No das asesoramiento financiero personalizado como si fueras un asesor regulado
- ❌ No predices precios futuros de criptomonedas o acciones con certeza
- ❌ No ejecutas operaciones reales (no tienes acceso a cuentas)
- ❌ No pides datos sensibles como contraseñas, claves privadas o PINs
- ❌ Si el usuario pide algo fuera del ámbito financiero/NexoPay, responde brevemente que estás especializado en finanzas y billetera digital

## Formato de respuestas
- Respuestas cortas (2-4 párrafos máximo) para preguntas simples
- Usa listas o bullets cuando hay múltiples puntos
- Para cálculos, muestra el resultado claramente
- Si no tienes datos en tiempo real (cotizaciones actuales), indícalo y ofrece explicar cómo consultarlas
- Cuando el usuario pregunte por una función específica de NexoPay, guíalo paso a paso

## Datos de NexoPay (referencia)
- Monedas soportadas: ARS (Peso argentino), USD (Dólar estadounidense), EUR (Euro), BTC, ETH, USDT
- Funciones principales: Exchange, Billetera multi-moneda, Metas de ahorro, Gastos compartidos, Historial de transacciones
- Comisiones: Varían según el par de divisas (referirse al panel de tarifas para datos exactos)`;

// ─── Límite de solicitudes por IP ────────────────────────────────────────────
// 30 mensajes por minuto es suficiente para uso normal del chat.
// Para escala alta, reemplazar con Upstash Redis + @upstash/ratelimit.
const LIMITE_SOLICITUDES = 30;
const VENTANA_MS         = 60_000; // 60 segundos

interface RegistroLimite { contador: number; inicio: number }
const contadoresPorIp = new Map<string, RegistroLimite>();

function excedeLimite(ip: string): boolean {
  const ahora   = Date.now();
  const registro = contadoresPorIp.get(ip);

  // Nueva ventana o primera solicitud
  if (!registro || ahora - registro.inicio > VENTANA_MS) {
    contadoresPorIp.set(ip, { contador: 1, inicio: ahora });
    return false;
  }

  if (registro.contador >= LIMITE_SOLICITUDES) return true;

  registro.contador += 1;
  return false;
}

// ─── Verificación de sesión en Railway (fail-open para el chat) ───────────────
// Si el backend no responde, el chat sigue funcionando (fail-open).
// El correo de Hernán no se toca — solo consultamos /auth/me.
async function verificarSesion(cookieHeader: string | undefined): Promise<boolean> {
  const backendBase = process.env.BACKEND_API_BASE;
  if (!backendBase) return true; // sin URL de backend → dejamos pasar

  try {
    const respuesta = await fetch(`${backendBase}/auth/me`, {
      method:  'GET',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      signal:  AbortSignal.timeout(3_000),
    });
    return respuesta.ok;
  } catch {
    // Si Railway no responde, el chat no debe bloquearse
    return true;
  }
}

// ─── Convierte el historial al formato de contenidos de Gemini ────────────────
function armarContenidos(historial: ChatMessage[], mensajeActual: string) {
  const contenidos: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of historial) {
    contenidos.push({
      role:  msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // El mensaje actual siempre va al final como turno del usuario
  contenidos.push({
    role:  'user',
    parts: [{ text: mensajeActual }],
  });

  return contenidos;
}

// ─── Handler principal de la Vercel Function ──────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cabeceras CORS para que el frontend en localhost:5173 pueda llamarla
  res.setHeader('Access-Control-Allow-Origin',      req.headers.origin ?? '*');
  res.setHeader('Access-Control-Allow-Methods',     'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',     'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight CORS
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Solo se acepta POST' });
  }

  // 1. Límite de solicitudes por IP
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket?.remoteAddress
    ?? 'desconocida';

  if (excedeLimite(ip)) {
    return res.status(429).json({
      code:    'RATE_LIMIT_EXCEEDED',
      message: `Máximo ${LIMITE_SOLICITUDES} mensajes por minuto. Esperá un momento.`,
    });
  }

  // 2. Verificar sesión activa en Railway
  const sesionValida = await verificarSesion(req.headers['cookie']);
  if (!sesionValida) {
    return res.status(401).json({
      code:    'UNAUTHORIZED',
      message: 'Debés iniciar sesión para usar el asistente.',
    });
  }

  // 3. Validar payload con Zod
  const resultado = chatSchema.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({
      code:    'VALIDATION_ERROR',
      message: 'El payload recibido no es válido.',
      detalles: resultado.error.issues,
    });
  }

  const { message, history } = resultado.data;

  // 4. Clave de API de Gemini — solo server-side, nunca en el bundle del browser
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[chatbot] GEMINI_API_KEY no está configurada en las variables de entorno.');
    return res.status(500).json({
      code:    'CONFIG_ERROR',
      message: 'El asistente no está configurado. Contactá al equipo técnico.',
    });
  }

  // 5. Llamada a Gemini 2.5 Flash via REST API
  try {
    const urlGemini =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const cuerpoGemini = {
      // Instrucción de sistema: le da identidad y contexto financiero a Nexo
      system_instruction: {
        parts: [{ text: NEXOPAY_SYSTEM_PROMPT }],
      },
      // Historial completo de la conversación + mensaje actual
      contents: armarContenidos(history, message),
      // Configuración de generación
      generationConfig: {
        temperature:     0.4,   // Preciso pero natural — ideal para respuestas financieras
        topP:            0.85,  // Muestrea del top 85% de probabilidad acumulada
        topK:            40,    // Limita el vocabulario activo a 40 tokens candidatos
        maxOutputTokens: 1024,  // Respuestas concisas pero completas
        candidateCount:  1,     // Una sola respuesta por llamada
      },
      // Configuración de seguridad — umbral medio para contexto financiero legítimo
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const respuestaGemini = await fetch(urlGemini, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(cuerpoGemini),
      signal:  AbortSignal.timeout(30_000), // 30 segundos de timeout
    });

    if (!respuestaGemini.ok) {
      const cuerpoError = await respuestaGemini.text();
      console.error('[chatbot] Error de la API de Gemini:', respuestaGemini.status, cuerpoError);
      return res.status(502).json({
        code:    'GEMINI_ERROR',
        message: 'No se pudo comunicar con el motor de IA. Intentá de nuevo.',
      });
    }

    const datosGemini = await respuestaGemini.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      promptFeedback?: { blockReason?: string };
    };

    // Si el mensaje fue bloqueado por los filtros de seguridad
    if (datosGemini.promptFeedback?.blockReason) {
      return res.status(400).json({
        code:    'CONTENIDO_BLOQUEADO',
        message: 'El mensaje fue bloqueado por los filtros de seguridad de la IA.',
      });
    }

    // Extraer la respuesta generada
    const respuesta =
      datosGemini.candidates?.[0]?.content?.parts?.[0]?.text
      ?? 'No pude generar una respuesta. Por favor, intentá de nuevo.';

    return res.status(200).json({ reply: respuesta });

  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[chatbot] Error inesperado:', err);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: mensajeError });
  }
}
