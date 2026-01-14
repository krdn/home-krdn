import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Dashboard 헤더 표시', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    // 시스템 상태 텍스트 확인
    await expect(page.locator('text=서비스 개요')).toBeVisible();
  });

  test('Quick Access 섹션 표시', async ({ page }) => {
    await expect(page.locator('text=Quick Access')).toBeVisible();
  });

  test('Sidebar 네비게이션 - Projects', async ({ page }) => {
    // Sidebar에서 Projects 링크 클릭
    await page.locator('aside').getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/admin\/projects/);
  });

  test('Sidebar 네비게이션 - Alerts', async ({ page }) => {
    // Sidebar에서 Alerts 링크 클릭
    await page.locator('aside').getByRole('link', { name: 'Alerts' }).click();
    await expect(page).toHaveURL(/\/admin\/alerts/);
  });

  test('AdminOverview 카드 표시', async ({ page }) => {
    await expect(page.locator('text=Admin Overview')).toBeVisible();
  });
});
