import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/projection/',
  server: {
    host: '0.0.0.0', // Слушать на всех интерфейсах
    port: 5173,
    strictPort: true, // Не использовать другой порт если 5173 занят
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})