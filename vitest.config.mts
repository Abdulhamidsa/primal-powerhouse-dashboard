import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: [
      'src/features/mobile-auth/**/*.test.ts',
      'src/features/user-dashboard/lib/*.test.ts',
      'src/features/learn/**/*.test.ts',
    ],
  },
});
