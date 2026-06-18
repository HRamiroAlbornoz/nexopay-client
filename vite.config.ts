import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Stripe from 'stripe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Emulador local de Serverless Functions (sólo para desarrollo)
function localServerlessPlugin() {
  return {
    name: 'local-serverless',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const env = loadEnv('', process.cwd(), '');
        
        // 1. Stripe Checkout Endpoint
        if (req.method === 'POST' && req.url === '/api/create-checkout') {
          const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-01-27.acacia' as any });
          let body = '';
          req.on('data', (chunk: any) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { amount, currency } = JSON.parse(body);
              const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                  price_data: {
                    currency: currency || 'ars',
                    product_data: { name: 'Recarga de Saldo Nexopay' },
                    unit_amount: Math.round(amount * 100),
                  },
                  quantity: 1,
                }],
                mode: 'payment',
                success_url: `http://localhost:5174/dashboard?success=true`,
                cancel_url: `http://localhost:5174/dashboard?canceled=true`,
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: session.url }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ message: err.message }));
            }
          });
          return;
        }

        // 2. S3 Presigned URL Endpoint
        if (req.method === 'GET' && req.url?.startsWith('/api/get-presigned-url')) {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const filename = urlObj.searchParams.get('filename') || 'doc';
            const contentType = urlObj.searchParams.get('contentType') || 'image/jpeg';
            
            const s3 = new S3Client({
              region: env.AWS_REGION || 'us-east-1',
              credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
              },
            });
            const command = new PutObjectCommand({
              Bucket: env.AWS_S3_BUCKET || 'nexopay-app',
              Key: `uploads/${Date.now()}-${filename}`,
              ContentType: contentType,
            });
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localServerlessPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://nexopay-api-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        // Ignoramos las rutas que maneja nuestro emulador local
        bypass: (req) => {
          if (req.url?.startsWith('/api/create-checkout') || req.url?.startsWith('/api/get-presigned-url')) {
            return req.url;
          }
        }
      },
    },
  },
});
