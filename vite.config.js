// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src', // Папка с исходными файлами
  build: {
    outDir: '../dist' // Папка для собранных файлов
  }
})
