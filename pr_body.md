Resumen

Esta PR limpia la historia y trae únicamente los cambios válidos para el frontend:
- `src/lib/apiError.ts` (nuevo util para parseo de errores API)
- Refactor de llamadas a la API para usar `parseApiResponse` (auth, chatbot, transactions, savings-goals, shared-expenses, wallet)
- Tests de Vitest en `src/tests/` y `vitest.config.ts`
- Fixes de tipado en Recharts: `BalanceChart` y `TransactionTimeline`

Verificaciones realizadas

- `npm run build`: OK (build completado sin errores)
- `npx vitest run`: OK (tests añadidos pasan)

Notas importantes

- Chatbot: el frontend ahora llama a `${API_BASE_URL}/chatbot`. El backend debe tener `GEMINI_API_KEY` configurada server-side y aplicar verificación de sesión *fail-closed*.
- Se eliminó la rama contaminada `feat/api-error-parser-tests` (remota y local).

Cómo probar localmente

```bash
git fetch origin
git checkout fix/cleanup-api-error-parser
npm ci
npm run build
npx vitest run
```

Solicito revisión: revisar tests, CI y confirmar variables de entorno de backend (GEMINI_API_KEY, FRONTEND_URL).
