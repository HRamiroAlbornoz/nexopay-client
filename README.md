# NexoPay Client

Frontend de NexoPay, una billetera digital multi-moneda (ARS, USD, EUR). Construido con React + TypeScript + Vite.

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router v7 (modo librería, `createBrowserRouter`)
- **Validación**: Zod (todas las respuestas de la API se validan en runtime, nunca se confía en el tipo solo a nivel de compilación)
- **Gráficos**: Recharts
- **Autenticación**: cookie httpOnly contra el backend (el frontend nunca ve el token) + Google Identity Services
- **Email**: AWS SES vía una Vercel Function (`api/send-email.ts`)
- **Testing**: Vitest

## Requisitos previos

- Node.js 18 o superior
- Git
- El backend (`nexopay-api`) corriendo, local o en producción — este proyecto no funciona de forma aislada, depende de la API real para todo (auth, balances, transacciones, tasas de cambio, chatbot)

## Instalación y setup local

**1. Clonar el repositorio**

```bash
git clone https://github.com/HRamiroAlbornoz/nexopay-client.git
cd nexopay-client
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar variables de entorno**

```bash
cp .env.example .env
```

Editar `.env` con los datos reales (ver [Variables de entorno](#variables-de-entorno)). Como mínimo, `VITE_API_URL` tiene que apuntar a una instancia real de `nexopay-api` (local o la de producción en Railway) para poder loguearse.

**4. Arrancar el servidor de desarrollo**

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`.

> Las credenciales de los usuarios de demo (creadas por el seed del backend) son `hernan@nexopay.com` / `Test1234` y `richard@nexopay.com` / `Test1234`.

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática (Vite) |
| `npm run build` | Type-check (`tsc -b`) + build de producción (`vite build`) |
| `npm run preview` | Sirve el build de producción localmente, para verificarlo antes de deployar |
| `npm run lint` | ESLint |
| `npm test` | Corre los tests con Vitest |

## Variables de entorno

| Variable | Descripción | Expuesta al browser |
|---|---|---|
| `VITE_API_URL` | URL base del backend, **incluyendo el sufijo `/api`** (ej: `https://nexopay-api-production.up.railway.app/api`) | Sí |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth, debe coincidir con el configurado en el backend | Sí |
| `AWS_ACCESS_KEY_ID` | Credencial AWS para SES | No (solo la usa la Vercel Function) |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS para SES | No (solo la usa la Vercel Function) |
| `AWS_REGION` | Región AWS (ej: `us-east-1`) | No (solo la usa la Vercel Function) |
| `SES_FROM_EMAIL` | Dirección remitente verificada en AWS SES | No (solo la usa la Vercel Function) |
| `BACKEND_API_BASE` | URL del backend, usada por la Vercel Function para verificar la sesión antes de enviar un email | No (solo la usa la Vercel Function) |

Cualquier variable con prefijo `VITE_` queda embebida en el bundle de JavaScript y es pública — por eso las credenciales de AWS y la URL interna de verificación **nunca** llevan ese prefijo: viven exclusivamente del lado servidor, dentro de `api/send-email.ts`.

> `VITE_GEMINI_API_KEY` figura en `.env.example` mantenido como remanente histórico, pero no se usa: el chatbot (`sendChatMessage`) llama directo al backend real (`POST /api/chatbot`), que tiene su propia integración con Gemini, acceso a los datos reales del usuario y sus propias protecciones contra prompt injection.

## Rutas de la aplicación

| Ruta | Acceso | Página |
|---|---|---|
| `/` | Pública | Landing — login y registro (tabs), redirige a `/dashboard` si ya hay sesión |
| `/login`, `/register` | Pública | Redirigen a `/` — el formulario real vive en Landing |
| `/dashboard` | Privada | Resumen de cuenta, compra de divisas, gráficos de balance y timeline de transacciones |
| `/wallet` | Privada | Saldos por moneda, transferencias a otros usuarios |
| `/transactions` | Privada | Historial paginado, conversión entre monedas (compra/venta/intercambio) |
| `/shared-expenses` | Privada | Crear y liquidar gastos compartidos |
| `/savings-goals` | Privada | Crear metas de ahorro y aportarles dinero |

Las rutas privadas están envueltas en `PrivateRoute` (redirige a `/login` si no hay sesión activa, no renderiza nada mientras la sesión está cargando) y comparten el layout de `AppLayout` (navbar + menú lateral + panel de cotizaciones + chatbot flotante).

## Deploy

El proyecto se deploya en **Vercel**, conectado a la rama `developer` de este repositorio (auto-deploy en cada push).

**Por qué Vercel**: integra Vite out-of-the-box sin configuración, sirve Vercel Functions (`api/send-email.ts`) en el mismo deploy sin infraestructura aparte, y el free tier alcanza para el alcance de este proyecto final.

**Pasos para deployar:**

1. Crear un proyecto en Vercel e importar este repositorio, configurando `developer` como rama de producción.
2. Configurar las variables de entorno en Vercel → Settings → Environment Variables (ver [Variables de entorno](#variables-de-entorno)) — **nunca en el código ni commiteadas**.
3. `vercel.json` ya define el rewrite necesario para que React Router maneje el cliente-side routing (todo lo que no empiece con `/api/` cae a `index.html`) sin romper las Vercel Functions.
4. Verificar después del deploy: cargar `/`, loguearse con un usuario de demo, y confirmar que el panel "Mercados en vivo" del Dashboard muestra cotizaciones — es la señal más rápida de que `VITE_API_URL` y CORS del backend están bien configurados.

**CORS**: el backend solo permite como origen el dominio exacto de producción del frontend (`Access-Control-Allow-Origin` específico, nunca `*`, porque las requests van con `credentials: 'include'`). Si Vercel genera una URL de alias distinta a la configurada en el backend (por ejemplo el alias `-git-developer-...` de un branch deploy), las requests fallan por CORS aunque el contenido sea idéntico — usar siempre el dominio canónico configurado en el backend.

## Estructura del proyecto

```
nexopay-client/
├── api/
│   └── send-email.ts          # Vercel Function: envía emails vía AWS SES,
│                               # verifica la sesión reenviando la cookie al backend real
├── src/
│   ├── pages/                 # Una carpeta por ruta (Landing, Dashboard, Wallet, ...)
│   ├── components/
│   │   ├── layout/             # AppLayout, Navbar, LeftPanel, RightPanel
│   │   ├── ui/                 # Button, Modal, CurrencyCard, TransactionItem
│   │   ├── charts/              # BalanceChart, TransactionTimeline (Recharts)
│   │   ├── Toast/               # Componente de alertas compartido por todas las páginas
│   │   ├── ChatWidget/          # Asistente conversacional (Gemini, vía backend real)
│   │   └── PrivateRoute/        # Guard de rutas autenticadas
│   ├── context/                # AuthContext (fuente de verdad de sesión), WalletContext
│   ├── hooks/                  # useAuth, useWallet, useTransactions, useSavingsGoals, ...
│   ├── api-calls/              # Funciones de fetch agrupadas por dominio (auth, wallet,
│   │                           # transactions, savings-goals, shared-expenses, rates,
│   │                           # chatbot, email) — única capa que llama al backend
│   ├── lib/                    # apiError (manejo de errores), apiConfig, form-utils,
│   │                           # transactionLabels, transactionEmail
│   ├── types/                  # Schemas Zod + tipos derivados, por dominio
│   ├── utils/                  # formatCurrency, formatDate, validators
│   ├── router/                 # Configuración de React Router
│   └── tests/                  # Tests de Vitest (api/, hooks/, lib/)
├── vercel.json                 # Rewrite para SPA routing
├── .env.example
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Decisiones de diseño

### Autenticación: cookie httpOnly, nunca el token en el cliente

El frontend nunca ve ni guarda el JWT — vive en una cookie `httpOnly` que setea el backend, y todas las requests van con `credentials: 'include'`. `AuthContext.tsx` es la única fuente de verdad de la sesión: al montar, primero revisa un hint en `localStorage` (`nexopay_session`) antes de golpear `GET /auth/me`, para no hacer ese round-trip de red en cada carga cuando ya sabemos que el usuario está deslogueado. Esto reduce la superficie de ataque de XSS (un script inyectado no puede leer el token) a costa de necesitar CORS con `credentials: true` y un origen específico, nunca `*`, en el backend.

### Capa `api-calls`: única responsable de hablar con el backend

Cada función de fetch vive en `src/api-calls/<dominio>/` y es la única que conoce la forma real de la respuesta del backend — la valida con Zod antes de devolverla, así un cambio de contrato en el backend rompe en un `.parse()` explícito y localizado, no en un `undefined` silencioso en medio de un componente. Ningún componente ni hook hace `fetch()` directo.

### Manejo de errores: `ApiError` + contrato `{ok, message}` en mutaciones

`src/lib/apiError.ts` parsea toda respuesta no-2xx en una `ApiError` tipada (`code`, `message`, `status`, `details`), con `isUnauthorized()` para distinguir sesión vencida del resto. Los hooks que ejecutan una mutación (crear, liquidar, aportar) devuelven `{ ok: true, data } | { ok: false, message }` en vez de lanzar o devolver un `boolean` — así la página que llama siempre puede mostrarle al usuario el mensaje real que vino del backend (por ejemplo, por qué falló crear un gasto compartido) en vez de un genérico "intentá de nuevo".

### Por qué la conversión de divisas se calcula en USD como base

`useExchangeRate` normaliza las tres monedas a un precio en USD (`current_price: 1.0` para USD, `rates.USD` para EUR, `rates.USD / rates.ARS` para ARS) en vez de comparar montos crudos en distintas monedas directamente — necesario porque, por ejemplo, comparar "150.000 ARS" contra "800 USD" sin normalizar haría que cualquier barra de progreso o gráfico mostrara al ARS como dominante solo por la magnitud del número, no por su valor real.

### Accesibilidad: navegación 100% por teclado, no solo por mouse

El menú lateral (`LeftPanel`) originalmente solo se expandía con `onMouseEnter`/`onMouseLeave` — un patrón común que deja afuera a cualquier usuario que navegue con teclado o lector de pantalla. Se agregaron los handlers `onFocus`/`onBlur` equivalentes (con `aria-expanded` reflejando el estado real) para que tabular hasta el menú lo abra igual que pasar el mouse. Las alertas (`Toast`) usan `role="alert"` + `aria-live="assertive"` para que un lector de pantalla anuncie el resultado de una acción sin que el usuario tenga que ir a buscarlo visualmente.

### Verificar contra la API real, no solo contra mocks

Durante el desarrollo, varias integraciones se verificaron en browser con datos de red mockeados (Playwright + `page.route()`) para poder probar flujos sin depender de la disponibilidad del backend en cada iteración. Esto ocultó por un tiempo un bug real: el proveedor de tasas de cambio que usaba el backend (Frankfurter) nunca soportó el Peso Argentino, así que `GET /api/rates` fallaba el 100% de las veces contra la API real — pero como los tests y verificaciones mockeaban la respuesta con valores ARS inventados, nunca se ejerció la integración real hasta probarla en producción. Lección aplicada: mockear acelera la iteración, pero al menos una verificación de cada integración externa tiene que pasar por la respuesta real del proveedor, no solo por el mock.

## Equipo

| Nombre | Rol |
|---|---|
| Hernán Ramiro Albornoz | Backend |
| Hernán Macias Hernández | Backend |
| Richard Anderson González | Frontend |
