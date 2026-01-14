import { test, expect } from '@playwright/test';

// Admin Dashboard 테스트는 인증이 필요합니다.
// 현재 /login 페이지가 없어서 인증 후 테스트 불가능.
// TODO: 로그인 페이지 구현 후 테스트 활성화

test.describe('Admin Dashboard', () => {
  test.skip('Dashboard 헤더 표시 (인증 필요)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test.skip('Quick Access 섹션 표시 (인증 필요)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Quick Access')).toBeVisible();
  });

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
});
