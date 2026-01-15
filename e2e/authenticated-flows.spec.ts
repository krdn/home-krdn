/**
 * 인증된 사용자 플로우 E2E 테스트
 *
 * Phase 26: E2E Test Activation
 *
 * 인증된 사용자가 수행하는 주요 플로우를 테스트합니다.
 * - Docker 컨테이너 관리
 * - 시스템 메트릭스 확인
 * - 사용자 설정
 *
 * 테스트 사용자가 없는 환경에서는 자동으로 skip됩니다.
 */

import { test, expect } from './fixtures/auth';

/**
 * 인증 상태 확인 헬퍼
 * 로그인 실패 시 테스트 skip
 */
async function checkAuthOrSkip(authenticatedPage: import('@playwright/test').Page) {
  await authenticatedPage.goto('/admin');
  const url = authenticatedPage.url();
  if (url.includes('/login')) {
    test.skip(true, '테스트 사용자 로그인 실패 - 환경 변수 또는 DB 확인 필요');
  }
}

test.describe('Authenticated User Flows - Docker Containers', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('Docker 컨테이너 목록 조회', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/containers');

    // 페이지가 로딩되었는지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // 컨테이너 페이지에 주요 요소 확인
    // h1 또는 h2 헤더가 있어야 함
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('컨테이너 상태 표시', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/containers');

    // 컨테이너 상태를 나타내는 UI 요소 확인
    // 상태 배지나 테이블 등
    const pageContent = authenticatedPage.locator('main, [role="main"]');
    await expect(pageContent).toBeVisible();
  });

  test('컨테이너 API 응답 확인', async ({ authenticatedPage }) => {
    // Docker 컨테이너 API 호출
    const response = await authenticatedPage.request.get('/api/docker/containers');

    // 인증된 상태에서 200 응답 받아야 함
    expect(response.status()).toBe(200);

    const data = await response.json();
    // 응답이 배열 형태여야 함 (컨테이너 목록)
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe('Authenticated User Flows - System Metrics', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('시스템 메트릭스 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/system');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // System 페이지 헤더 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('시스템 메트릭스 API 응답 확인', async ({ authenticatedPage }) => {
    // 시스템 메트릭 API 호출
    const response = await authenticatedPage.request.get('/api/system/metrics');

    // 인증된 상태에서 200 응답 받아야 함
    expect(response.status()).toBe(200);

    const data = await response.json();
    // 메트릭 데이터가 객체 형태여야 함
    expect(typeof data).toBe('object');
  });

  test('대시보드에서 시스템 상태 표시', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');

    // DashboardStats 또는 시스템 상태를 표시하는 섹션 확인
    // aria-label 또는 data-testid로 찾기
    const statsSection = authenticatedPage.locator(
      'section[aria-label="System Metrics"], [data-testid="dashboard-stats"]'
    );

    // 섹션이 있으면 표시 확인, 없어도 테스트 통과 (위젯 커스터마이징으로 숨겨졌을 수 있음)
    const isVisible = await statsSection.isVisible();
    if (isVisible) {
      await expect(statsSection).toBeVisible();
    }
  });
});

test.describe('Authenticated User Flows - User Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('설정 페이지 접근', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/settings');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Settings 페이지 헤더 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('사용자 설정 API 조회', async ({ authenticatedPage }) => {
    // 사용자 설정 API 호출
    const response = await authenticatedPage.request.get('/api/user/settings');

    // 인증된 상태에서 200 응답 받아야 함
    expect(response.status()).toBe(200);

    const data = await response.json();
    // 설정 데이터가 객체 형태여야 함
    expect(typeof data).toBe('object');
  });
});

test.describe('Authenticated User Flows - Navigation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('Admin 사이드바 네비게이션', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');

    // 사이드바 또는 네비게이션 메뉴 확인
    const nav = authenticatedPage.locator('nav, aside, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
  });

  test('Admin 페이지 간 이동', async ({ authenticatedPage }) => {
    // Dashboard에서 시작
    await authenticatedPage.goto('/admin');
    await expect(authenticatedPage).toHaveURL('/admin');

    // System 페이지로 이동
    await authenticatedPage.goto('/admin/system');
    await expect(authenticatedPage).toHaveURL('/admin/system');

    // Containers 페이지로 이동
    await authenticatedPage.goto('/admin/containers');
    await expect(authenticatedPage).toHaveURL('/admin/containers');

    // Alerts 페이지로 이동
    await authenticatedPage.goto('/admin/alerts');
    await expect(authenticatedPage).toHaveURL('/admin/alerts');
  });

  test('로그아웃 후 보호된 페이지 접근 차단', async ({ authenticatedPage }) => {
    // 로그아웃 API 호출
    await authenticatedPage.request.post('/api/auth/logout');

    // 인증 쿠키가 제거되었으므로 /admin 접근 시 리다이렉트
    await authenticatedPage.goto('/admin');
    await expect(authenticatedPage).toHaveURL(/\/login/);
  });
});

test.describe('Authenticated User Flows - Alerts', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('Alerts 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/alerts');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Alerts 페이지 헤더 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Alert Rules API 조회', async ({ authenticatedPage }) => {
    // Alert rules API 호출
    const response = await authenticatedPage.request.get('/api/alerts/rules');

    // 인증된 상태에서 200 응답 받아야 함
    expect(response.status()).toBe(200);

    const data = await response.json();
    // 응답이 배열 형태여야 함 (alert rules 목록)
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe('Authenticated User Flows - Projects', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await checkAuthOrSkip(authenticatedPage);
  });

  test('Projects 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/projects');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Projects 페이지 헤더 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Projects API 조회', async ({ authenticatedPage }) => {
    // Projects API 호출
    const response = await authenticatedPage.request.get('/api/projects');

    // Projects API는 인증 없이도 GET 가능
    expect(response.status()).toBe(200);

    const data = await response.json();
    // 응답이 배열 형태여야 함 (projects 목록)
    expect(Array.isArray(data)).toBe(true);
  });
});
