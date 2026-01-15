/**
 * E2E 테스트용 인증 Fixture
 *
 * Phase 26: E2E Test Activation
 *
 * API 로그인을 통해 인증 상태를 재사용하여
 * Admin 페이지 테스트를 효율적으로 수행합니다.
 *
 * 사용법:
 * ```typescript
 * import { test, expect } from '../fixtures/auth';
 *
 * test('인증된 상태에서 테스트', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/admin');
 *   // 인증된 상태로 테스트 진행
 * });
 * ```
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// 테스트용 계정 정보 (환경 변수에서 로드)
const TEST_USER = {
  username: process.env.TEST_USER_USERNAME || 'admin',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

// Fixture 타입 정의
type AuthFixtures = {
  /** API 로그인 후 인증된 페이지 */
  authenticatedPage: Page;
  /** API 로그인을 수행하는 헬퍼 함수 */
  loginViaApi: (page: Page, username?: string, password?: string) => Promise<boolean>;
};

/**
 * 인증 Fixture 확장
 */
export const test = base.extend<AuthFixtures>({
  // API 로그인 헬퍼 함수
  loginViaApi: async ({}, use) => {
    const login = async (
      page: Page,
      username: string = TEST_USER.username,
      password: string = TEST_USER.password
    ): Promise<boolean> => {
      try {
        // API를 통해 로그인
        const response = await page.request.post('/api/auth/login', {
          data: { username, password },
        });

        if (response.ok()) {
          const data = await response.json();
          if (data.success) {
            // 응답 쿠키가 자동으로 브라우저 컨텍스트에 설정됨
            return true;
          }
        }
        return false;
      } catch {
        return false;
      }
    };

    await use(login);
  },

  // 인증된 페이지 제공
  authenticatedPage: async ({ page, loginViaApi }, use) => {
    // 테스트 시작 전 로그인 시도
    const success = await loginViaApi(page);

    if (!success) {
      // 테스트 환경에 테스트 사용자가 없을 수 있음
      // 이 경우 경고만 출력하고 진행 (개별 테스트에서 처리)
      console.warn(
        '[Auth Fixture] 로그인 실패 - 테스트 사용자 계정을 확인하세요.'
      );
    }

    await use(page);
  },
});

// expect re-export
export { expect };

/**
 * Storage State를 사용한 인증 재사용 설정
 *
 * playwright.config.ts에서 사용:
 * ```typescript
 * projects: [
 *   { name: 'setup', testMatch: /auth.setup.ts/ },
 *   {
 *     name: 'chromium',
 *     use: { storageState: 'playwright/.auth/user.json' },
 *     dependencies: ['setup'],
 *   },
 * ]
 * ```
 */
export const AUTH_FILE = 'playwright/.auth/user.json';

/**
 * 로그인 상태 확인 헬퍼
 * 쿠키나 인증 상태를 확인합니다.
 */
export async function isAuthenticated(context: BrowserContext): Promise<boolean> {
  const cookies = await context.cookies();
  return cookies.some((cookie) => cookie.name === 'auth-token');
}

/**
 * 로그아웃 헬퍼
 * 인증 쿠키를 제거합니다.
 */
export async function logout(page: Page): Promise<void> {
  // auth-token 쿠키 제거
  await page.context().clearCookies({ name: 'auth-token' });
}
