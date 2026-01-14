import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Admin 페이지 직접 접근 가능', async ({ page }) => {
    // 현재 구조에서는 Admin 페이지가 직접 접근 가능
    // API 호출 시에만 인증 필요
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('API 인증 없이 프로젝트 목록 조회 가능 (GET)', async ({ request }) => {
    // GET 요청은 인증 없이 가능
    const response = await request.get('/api/projects');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });

  test('API 인증 없이 쓰기 작업 차단 (POST)', async ({ request }) => {
    // POST 요청은 인증 필요
    const response = await request.post('/api/projects', {
      data: {
        name: 'Test Project',
        slug: 'test-project',
        description: 'Test',
        category: 'web',
        techStack: ['React'],
        status: 'in-progress',
        featured: false,
      },
    });
    // 인증 없이는 401 반환
    expect(response.status()).toBe(401);
  });

  test('로그인 API 호출', async ({ request }) => {
    // 잘못된 비밀번호로 로그인 시도
    const response = await request.post('/api/auth/login', {
      data: { password: 'wrong-password' },
    });
    expect(response.status()).toBe(401);
  });
});
