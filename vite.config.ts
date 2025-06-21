
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allows access from network
    watch: {
      usePolling: true, // Enables hot reload in Docker
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
})
