import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, todas las llamadas a /api se envían al API Gateway (Nginx) del backend.
// El gateway usa un certificado autofirmado, por eso secure:false.
// Se elimina la cabecera Origin para que la política CORS de los microservicios
// (que solo permite http(s)://localhost) no bloquee las peticiones del dev server (puerto 5173).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'https://localhost';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1200
    }
  };
});
