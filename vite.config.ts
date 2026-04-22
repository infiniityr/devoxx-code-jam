import { defineConfig } from 'vite';

export default defineConfig({
  base: '/devoxx-code-jam/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
