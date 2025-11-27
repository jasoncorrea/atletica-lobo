import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path set to root for Vercel deployment stability
  base: '/', 
  build: {
    outDir: 'dist',
  }
})