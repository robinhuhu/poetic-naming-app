import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
 
 export default defineConfig({
   plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('lunar-javascript')) {
              return 'lunar';
            }
            return 'deps';
          }
        },
      },
    },
  },
 })
