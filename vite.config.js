import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // Укажите папку, где находится ваш index.html
  build: {
    outDir: '../dist' // Укажите папку, куда должны быть собраны файлы
  }
});
