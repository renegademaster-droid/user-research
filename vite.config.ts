import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/user-research/',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
