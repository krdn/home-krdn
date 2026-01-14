import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('홈페이지 로딩', async ({ page }) => {
    await page.goto('/');
    // Hero 섹션이 표시되는지 확인
    await expect(page.locator('text=AI & Automation')).toBeVisible();
  });

  test('Services 페이지 이동', async ({ page }) => {
    await page.goto('/');
    // Header 네비게이션에서 Services 클릭
    await page.getByRole('link', { name: 'Services' }).first().click();
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Projects 페이지 이동', async ({ page }) => {
    await page.goto('/');
    // Header 네비게이션에서 Projects 클릭
    await page.getByRole('link', { name: 'Projects' }).first().click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
