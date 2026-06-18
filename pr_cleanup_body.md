Fix: eliminar archivos reintroducidos accidentalmente

Resumen
-------
Este PR elimina archivos y carpetas que se reintrodujeron por error en commits previos y están contaminando la rama `developer`.
Elementos eliminados (ejemplos):
- `admin/` (carpeta completa de administración)
- `pages/cart/` y `pages/checkout/`
- `routes/firebaseAdmin.js`
- `api/chatbot.ts` (Vercel Function que fue retirada en favor de llamadas directas al backend)

Motivación
----------
Estos archivos fueron añadidos inadvertidamente en commits identificados como `e6ac9ae` y `07870ed` y restablecen código que habíamos eliminado/reemplazado por motivos de seguridad y arquitectura (evitar functions expuestas, separar responsibilities, mantener integridad del repo).

Qué incluye este PR
-------------------
- Eliminación segura de los paths arriba listados.
- No reescribe historia: es una rama dedicada (`cleanup/remove-contamination`) que contiene un commit que elimina los archivos para facilitar revisión y merge.
- Validaciones locales: `npx vitest run` → 4/4 tests passed.

Cómo revisar localmente
----------------------
```bash
git fetch origin
git checkout developer
git pull origin developer
git checkout -b review/cleanup origin/cleanup/remove-contamination
# Revisá los cambios
git diff --name-status developer..review/cleanup
# Correr tests
npm ci
npx vitest run
npm run build
```

Notas y recomendaciones
----------------------
- Recomiendo habilitar branch protections en `developer` (PR review + CI) para evitar reintroducciones accidentales.
- Si preferís revertir commits concretos en lugar de eliminar los archivos, puedo preparar esa alternativa.

Gracias — dejo este PR para revisión y merge responsable.
