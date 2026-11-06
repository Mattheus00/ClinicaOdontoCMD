import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: { proxy: { '/api': process.env.DENTIC_API_PROXY ?? 'http://localhost:8080' } },
  server: {
    proxy: {
      '/api': process.env.DENTIC_API_PROXY ?? 'http://localhost:8080',
    },
  },
})
