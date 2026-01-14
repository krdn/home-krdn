import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('미인증 시 Admin 페이지 접근하면 로그인으로 리다이렉트', async ({ page }) => {
    // 미들웨어가 /login으로 리다이렉트
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('API 인증 없이 프로젝트 목록 조회 가능 (GET)', async ({ request }) => {
    // GET 요청은 인증 없이 가능
    const response = await request.get('/api/projects');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('보호된 API는 인증 필요 (Docker)', async ({ request }) => {
    // Docker API는 인증 필요
    const response = await request.get('/api/docker/containers');
    expect(response.status()).toBe(401);
  });

  test('로그인 API 호출', async ({ request }) => {
    // 잘못된 비밀번호로 로그인 시도
    const response = await request.post('/api/auth/login', {
      data: { password: 'wrong-password' },
    });
    // 4xx 에러 반환
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
