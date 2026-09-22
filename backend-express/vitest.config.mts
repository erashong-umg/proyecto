import { defineConfig } from 'vitest/config';
import path from 'path';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@models': path.resolve(root, 'src/models'),
      '@controllers': path.resolve(root, 'src/controllers'),
      '@services': path.resolve(root, 'src/services'),
      '@middleware': path.resolve(root, 'src/middleware'),
      '@routes': path.resolve(root, 'src/routes'),
      '@utils': path.resolve(root, 'src/utils'),
      '@sockets': path.resolve(root, 'src/sockets'),
      '@config': path.resolve(root, 'src/config'),
      '@types': path.resolve(root, 'src/types'),
    },
  },
});
