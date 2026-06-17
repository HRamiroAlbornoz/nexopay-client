import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En desarrollo local (vite dev), redirige /api/chatbot al backend Railway.
      // En producción (Vercel), esta ruta la maneja la Vercel Function api/chatbot.ts.
      '/api/chatbot': {
        target: 'https://nexopay-api-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
