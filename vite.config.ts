import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // En desarrollo local, redirige /api/chatbot al backend de Railway.
        // En producción (Vercel), esta ruta va directo a la Vercel Function api/chatbot.ts.
        // VITE_API_URL ya incluye el sufijo /api, por eso lo removemos para obtener la base.
        '/api/chatbot': {
          target: env.VITE_API_URL
            ? env.VITE_API_URL.replace(/\/api$/, '')
            : 'https://nexopay-api-production.up.railway.app',
          changeOrigin: true,
          secure:       true,
        },
      },
    },
  };
});
