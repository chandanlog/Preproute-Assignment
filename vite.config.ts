import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://admin-moderator-backend-staging.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    },
    watch: {
      ignored: [
        '**/src - Copy/**',
        '**/node_modules - Copy/**',
        '**/dist - Copy/**',
        '**/Preproute-Assignment - Copy/**'
      ]
    }
  }
})
