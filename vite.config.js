import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 8080,
    proxy: {
      // Unified API proxy forwarding directly to our Express security server
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})
