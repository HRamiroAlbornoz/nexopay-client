# Reestructuración y Limpieza del Proyecto NexoPay

Esta propuesta aborda los bloqueos de la rama actual y resuelve las decisiones arquitectónicas pendientes para continuar con la implementación del Chatbot.

## User Review Required
> [!IMPORTANT]
> **Reescritura de historial**: Se descartará la rama actual (`feature/skyline-shift`) ya que fue contaminada con archivos de otro proyecto (`riccie-pallets-app`). Crearé una nueva rama desde `developer` llamada `feature/skyline-shift-clean` importando manualmente **sólo** los archivos de NexoPay.

> [!IMPORTANT]
> **Decisión de Arquitectura del Chatbot**: Confirmando tu luz verde, **eliminaré** la Vercel Function (`api/chatbot.ts`). Esto resuelve automáticamente el problema de "fail-open" y el CORS abierto. En su lugar, modificaré `src/api-calls/chatbot/chatbot.post.ts` para que se comunique directamente con el backend real en `${API_BASE_URL}/chatbot`, unificando la lógica de negocio en `nexopay-api`.

## Propuesta de Cambios

### 1. Limpieza de Repositorio (Git)
Se migrarán de forma limpia los siguientes directorios y archivos de la rama contaminada hacia una base pura de `developer`:
- `src/` (todos los componentes, contextos, api-calls válidos y tests)
- `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`

Se dejarán atrás permanentemente los directorios ajenos (`admin/`, `common/`, `pages/`, `routes/`).

### 2. Dashboard UI
Se removerán los componentes destinados al panel de administrador que actualmente se muestran en el panel de usuario regular:
- **[MODIFY]** `src/pages/Dashboard/Dashboard.tsx`
  - Eliminación de `<BalanceChart />` y su sección "Evolución de Balances".
  - Eliminación de `<TransactionTimeline />` y su sección "Timeline de Transacciones".
  - Eliminación del bloque de "Estado de Verificación" y de carga local de documentos (S3 no implementado en cliente regular).

### 3. Restauración de Tipado Estricto (Recharts)
Se revertirá el hack de `| any` (que causaba regresiones en el tipado), devolviendo los componentes a su contrato estricto de Recharts v3.
- **[MODIFY]** `src/components/charts/BalanceChart/BalanceChart.tsx`
- **[MODIFY]** `src/components/charts/TransactionTimeline/TransactionTimeline.tsx`

### 4. Refactor de Arquitectura Chatbot
- **[MODIFY]** `src/api-calls/chatbot/chatbot.post.ts`
  - El endpoint apuntará a `${API_BASE_URL}/chatbot`.
  - Se garantizará el uso de `credentials: 'include'` para que el JWT viaje al backend real.

## Plan de Verificación
1. **Git Status**: Comprobar que no existe ningún rastro de archivos de e-commerce.
2. **TypeScript**: Ejecutar `npm run build` o `tsc -b` para asegurar que el tipado estricto en Recharts no bloquea el build.
3. **Dashboard**: Correr localmente para verificar que la interfaz luce limpia, sin gráficas ni paneles de carga de documentos.
