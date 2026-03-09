import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: '../static',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        success: resolve(__dirname, 'src/success.html'),
        terms: resolve(__dirname, 'src/terms.html'),
        admin: resolve(__dirname, 'src/admin/index.html'),
      },
    },
  },
})
