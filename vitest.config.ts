import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.d.ts',
        'src/types/**',
      ],
      thresholds: {
        // Phase 25: 핵심 lib 모듈 테스트 완료 (rbac 97%, auth 78%, services 100%)
        // 전체 threshold는 UI 컴포넌트 포함으로 낮게 설정
        // Phase 26 E2E 테스트 후 점진적으로 상향 예정
        statements: 8,
        branches: 6,
        functions: 5,
        lines: 8,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
