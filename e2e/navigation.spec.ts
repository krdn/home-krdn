import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('홈페이지 로딩', async ({ page }) => {
    await page.goto('/');
    // Hero 섹션 타이틀 확인 (exact match)
    await expect(page.getByText('Development Hub', { exact: true })).toBeVisible();
  });

  test('Services 페이지 이동', async ({ page }) => {
    await page.goto('/');
    // Services 보기 버튼 클릭
    await page.getByRole('link', { name: /Services 보기/ }).click();
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Projects 페이지 이동', async ({ page }) => {
    await page.goto('/');
    // Header 네비게이션에서 Projects 클릭 (exact match)
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
