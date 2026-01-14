# Testing Patterns

**Analysis Date:** 2026-01-14

## Test Framework

**Runner:**
- Not configured
- No test framework installed (no Jest, Vitest, or similar)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test scripts available
npm run lint  # Only linting available
```

## Test File Organization

**Location:**
- No test files exist in the codebase

**Naming:**
- Not applicable (no tests)

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- Not applicable

**Patterns:**
- Not established

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not established

**What Would Need Mocking:**
- Docker socket communication (`src/lib/docker.ts`)
- System commands (`execSync` in `src/lib/system.ts`)
- File system access (`/proc/stat`)
- API fetch calls in hooks

## Fixtures and Factories

**Test Data:**
- Not established

**Location:**
- Not established

## Coverage

**Requirements:**
- No coverage targets
- No coverage tooling

**Configuration:**
- Not configured

## Test Types

**Unit Tests:**
- Not implemented
- Critical areas lacking tests:
  - `src/lib/docker.ts` - Docker API client
  - `src/lib/system.ts` - System metrics parsing
  - `src/lib/utils.ts` - Utility functions
  - `src/config/services.ts` - Helper functions

**Integration Tests:**
- Not implemented
- Would be valuable for:
  - API route handlers (`src/app/api/`)
  - Docker integration
  - End-to-end data flow

**E2E Tests:**
- Not implemented
- Playwright/Cypress not installed

## Recommended Test Setup

**Suggested Framework:**
- Vitest (fast, TypeScript-native, Vite-compatible)
- Alternative: Jest with ts-jest

**Suggested Structure:**
```
src/
  lib/
    docker.ts
    docker.test.ts      # Co-located unit tests
    system.ts
    system.test.ts
  hooks/
    useSystemMetrics.ts
    useSystemMetrics.test.ts
  app/
    api/
      system/
        route.ts
        route.test.ts   # API route tests
```

**Priority Test Targets:**
1. `src/lib/docker.ts` - Critical Docker communication
2. `src/lib/system.ts` - System metrics parsing
3. `src/app/api/system/route.ts` - API endpoint
4. `src/app/api/docker/containers/route.ts` - Container API
5. `src/hooks/useSystemMetrics.ts` - Data fetching hook

**Suggested Dependencies:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.0.0"  // For API mocking
  }
}
```

**vitest.config.ts Example:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

## Current Quality Assurance

**Available:**
- ESLint for static analysis
- TypeScript for type checking
- Manual testing only

**Missing:**
- Unit tests
- Integration tests
- E2E tests
- Coverage reporting
- Pre-commit hooks
- CI test pipeline

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*
