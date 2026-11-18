import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: []
      },
      rollupOptions: {
        external: ['better-sqlite3']
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    root: resolve('src/renderer'),
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()]
  }
});

