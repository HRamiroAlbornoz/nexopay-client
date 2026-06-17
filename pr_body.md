# fix(repo): Reaplicar ApiError, tests y refactor de llamadas API

Resumen
------
- Reintroduce `src/lib/apiError.ts` (parser central de errores API).
- Añade `vitest.config.ts` y pruebas unitarias en `src/tests/api/*` (chatbot y transactions).
- Refactor de wrappers de API para usar `parseApiResponse` y `ApiError`.
- Los tests locales pasan y la rama fue sincronizada con `origin`.

Motivación
----------
Unificar el manejo de errores desde el frontend y asegurar contratos predecibles con el backend. Esto facilita el manejo de códigos HTTP (429, 422, 401, etc.) y mejora la experiencia de debugging.

Validaciones realizadas
----------------------
- `npx vitest run` → 4/4 tests passed
- `npm run build` → OK (revisado en local previo)

Qué revisar en el PR
--------------------
- Confirmar que los endpoints críticos (`/chatbot`, transacciones, wallet) sigan funcionando con `credentials: 'include'`.
- Verificar que `GEMINI_API_KEY` y las llamadas al backend del chatbot se mantengan server-side.

Comandos útiles
--------------
```bash
npm ci
npx vitest run
npm run build
```

Notas
-----
Este PR reaplica cambios que fueron revertidos de forma segura en `feature/skyline-shift-clean`; los conflictos se resolvieron manualmente antes del revert. Si querés que reintegre sólo partes específicas del util o tests, indicamelo en comentarios.
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
