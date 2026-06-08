# nexopay-client

Frontend de NexoPay — billetera digital multi-moneda (ARS, USD, EUR).

**Stack:** React + TypeScript + Vite → Vercel

---

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

---

## Variables de entorno

| Variable | Descripción | Expuesta al browser |
|---|---|---|
| `VITE_API_URL` | URL base del backend (nexopay-api) | Sí |
| `VITE_GEMINI_API_KEY` | API key de Gemini 2.5 Flash (chatbot) | Sí |
| `AWS_ACCESS_KEY_ID` | Credencial AWS para SES | No (Vercel Function) |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS para SES | No (Vercel Function) |
| `AWS_REGION` | Región AWS (ej: us-east-1) | No (Vercel Function) |
| `SES_FROM_EMAIL` | Dirección remitente de emails | No (Vercel Function) |

> Las variables `AWS_*` y `SES_*` **no** llevan prefijo `VITE_` — son exclusivas de la Vercel Function `api/send-email.ts` y nunca se exponen al bundle del browser.

---

## Scripts

```bash
npm run dev       # Servidor de desarrollo (Vite)
npm run build     # Build de producción (TypeScript + Vite)
npm run preview   # Preview del build de producción
npm run lint      # ESLint
```

---

## Estructura

```
api/                        # Vercel Functions (server-side)
  send-email.ts             # Envío de emails via AWS SES
src/
  components/
    layout/                 # Navbar, Sidebar
    ui/                     # Button, Modal, CurrencyCard, TransactionItem
    charts/                 # BalanceChart, TransactionTimeline
    ChatWidget/             # Chatbot Gemini
  pages/                    # Landing, Login, Register, Dashboard, Wallet,
                            # Transactions, SharedExpenses, SavingsGoals
  context/                  # AuthContext, WalletContext
  hooks/                    # useAuth, useWallet, useTransactions, ...
  api-calls/                # Funciones de fetch agrupadas por dominio
  types/                    # Interfaces TypeScript del dominio
  utils/                    # formatCurrency, formatDate, validators
```

---

## Deploy

El proyecto se deploya en [Vercel](https://vercel.com). El archivo `vercel.json` configura el fallback SPA para React Router y mantiene las Vercel Functions en `api/` funcionando correctamente.

Las variables de entorno de producción se configuran en el dashboard de Vercel — nunca en archivos commiteados.
