import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Only scan the real app for dependencies (not dist-demo/ or release/ build output)
    optimizeDeps: {
      entries: ['index.html'],
    },
    server: {
      // Set DISABLE_HMR=true to turn off hot reload and file watching
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/dist-demo/**', '**/release/**'] },
    },
  };
});
