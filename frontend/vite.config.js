import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/login.html'),
        previsao: resolve(__dirname, 'src/main.html')
      },
      output: {
        // Preservar estrutura de diretórios
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    assetsDir: 'assets',
    emptyOutDir: true,
    // Garantir que arquivos estáticos sejam copiados
    copyPublicDir: true
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
