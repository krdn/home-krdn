import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Dashboard 헤더 표시', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=시스템 상태')).toBeVisible();
  });

  test('Quick Access 섹션 표시', async ({ page }) => {
    await expect(page.locator('text=Quick Access')).toBeVisible();
    // 5개 Quick Access 카드 확인
    await expect(page.locator('text=Projects').first()).toBeVisible();
    await expect(page.locator('text=Alerts').first()).toBeVisible();
    await expect(page.locator('text=Services').first()).toBeVisible();
    await expect(page.locator('text=Containers').first()).toBeVisible();
    await expect(page.locator('text=System').first()).toBeVisible();
  });

  test('Sidebar 네비게이션 - Projects', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects' }).first().click();
    await expect(page).toHaveURL(/\/admin\/projects/);
  });

  test('Sidebar 네비게이션 - Alerts', async ({ page }) => {
    await page.getByRole('link', { name: 'Alerts' }).first().click();
    await expect(page).toHaveURL(/\/admin\/alerts/);
  });

  test('AdminOverview 카드 표시', async ({ page }) => {
    await expect(page.locator('text=Admin Overview')).toBeVisible();
  });
});
