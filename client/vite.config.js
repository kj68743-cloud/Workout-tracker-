import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, forward API calls to the local Express server so the
      // client can just call same-origin `/api/...` paths.
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
