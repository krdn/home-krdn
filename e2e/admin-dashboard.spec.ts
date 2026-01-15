/**
 * Admin Dashboard E2E 테스트
 *
 * Phase 26: E2E Test Activation
 *
 * Admin 대시보드 페이지의 주요 기능 테스트입니다.
 * authenticatedPage fixture를 사용하여 로그인된 상태에서 테스트합니다.
 *
 * 인증이 필요한 테스트는 로그인 성공 여부를 먼저 확인하고,
 * 로그인 실패 시 테스트를 skip합니다.
 */

import { test, expect } from './fixtures/auth';

test.describe('Admin Dashboard - Unauthenticated', () => {
  test('미인증 시 Admin 접근하면 리다이렉트', async ({ page }) => {
    await page.goto('/admin');
    // /login으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/login/);
  });

  test('미인증 시 Admin Projects 접근하면 리다이렉트', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('미인증 시 Admin Alerts 접근하면 리다이렉트', async ({ page }) => {
    await page.goto('/admin/alerts');
    await expect(page).toHaveURL(/\/login/);
  });

  test('미인증 시 Admin Containers 접근하면 리다이렉트', async ({ page }) => {
    await page.goto('/admin/containers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('미인증 시 Admin System 접근하면 리다이렉트', async ({ page }) => {
    await page.goto('/admin/system');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin Dashboard - Authenticated', () => {
  // 인증이 필요한 테스트: 로그인 실패 시 skip
  test.beforeEach(async ({ authenticatedPage }) => {
    // 인증 상태 확인: /admin 접근 후 /login으로 리다이렉트되면 skip
    await authenticatedPage.goto('/admin');
    const url = authenticatedPage.url();
    if (url.includes('/login')) {
      test.skip(true, '테스트 사용자 로그인 실패 - 환경 변수 또는 DB 확인 필요');
    }
  });

  test('Dashboard 헤더 표시', async ({ authenticatedPage }) => {
    // beforeEach에서 이미 /admin으로 이동됨
    // Dashboard 또는 대시보드 헤더 확인 (다국어 대응)
    const header = authenticatedPage.locator('h1');
    await expect(header).toBeVisible();
    // Dashboard 텍스트가 포함된 h1 확인
    await expect(header).toContainText('Dashboard');
  });

  test('Quick Access 섹션 표시', async ({ authenticatedPage }) => {
    // Quick Access 섹션 확인 (aria-label 또는 텍스트로)
    const quickAccessSection = authenticatedPage.locator(
      'section[aria-label="Quick Access"]'
    );
    await expect(quickAccessSection).toBeVisible();
  });

  test('Projects 링크 클릭 시 /admin/projects로 이동', async ({
    authenticatedPage,
  }) => {
    // Projects 링크 찾기 및 클릭
    const projectsLink = authenticatedPage.locator('a[href="/admin/projects"]');
    await expect(projectsLink).toBeVisible();
    await projectsLink.click();

    // /admin/projects 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/admin/projects');
  });

  test('Alerts 링크 클릭 시 /admin/alerts로 이동', async ({
    authenticatedPage,
  }) => {
    // Alerts 링크 찾기 및 클릭
    const alertsLink = authenticatedPage.locator('a[href="/admin/alerts"]');
    await expect(alertsLink).toBeVisible();
    await alertsLink.click();

    // /admin/alerts 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/admin/alerts');
  });

  test('Services 링크 클릭 시 /admin/services로 이동', async ({
    authenticatedPage,
  }) => {
    // Services 링크 찾기 및 클릭
    const servicesLink = authenticatedPage.locator('a[href="/admin/services"]');
    await expect(servicesLink).toBeVisible();
    await servicesLink.click();

    // /admin/services 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/admin/services');
  });

  test('Containers 링크 클릭 시 /admin/containers로 이동', async ({
    authenticatedPage,
  }) => {
    // Containers 링크 찾기 및 클릭
    const containersLink = authenticatedPage.locator(
      'a[href="/admin/containers"]'
    );
    await expect(containersLink).toBeVisible();
    await containersLink.click();

    // /admin/containers 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/admin/containers');
  });

  test('System 링크 클릭 시 /admin/system으로 이동', async ({
    authenticatedPage,
  }) => {
    // System 링크 찾기 및 클릭
    const systemLink = authenticatedPage.locator('a[href="/admin/system"]');
    await expect(systemLink).toBeVisible();
    await systemLink.click();

    // /admin/system 페이지로 이동 확인
    await expect(authenticatedPage).toHaveURL('/admin/system');
  });
});

test.describe('Admin Sub-Pages', () => {
  // 인증이 필요한 테스트: 로그인 실패 시 skip
  test.beforeEach(async ({ authenticatedPage }) => {
    // 인증 상태 확인: /admin 접근 후 /login으로 리다이렉트되면 skip
    await authenticatedPage.goto('/admin');
    const url = authenticatedPage.url();
    if (url.includes('/login')) {
      test.skip(true, '테스트 사용자 로그인 실패 - 환경 변수 또는 DB 확인 필요');
    }
  });

  test('Admin Projects 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/projects');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // 페이지에 주요 컨텐츠가 있는지 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Admin Alerts 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/alerts');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Alerts 관련 컨텐츠 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Admin Containers 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/containers');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Containers 관련 컨텐츠 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Admin System 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/system');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // System 관련 컨텐츠 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Admin Services 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/services');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Services 관련 컨텐츠 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Admin Settings 페이지 로딩', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/settings');

    // 페이지가 로그인 페이지가 아닌지 확인
    await expect(authenticatedPage).not.toHaveURL(/\/login/);

    // Settings 관련 컨텐츠 확인
    const heading = authenticatedPage.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
