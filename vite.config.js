// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src', // Указываем папку с исходными файлами
  build: {
    outDir: '../dist' // Указываем папку для собранных файлов
  }
})
