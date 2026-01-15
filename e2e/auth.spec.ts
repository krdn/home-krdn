/**
 * 인증 E2E 테스트
 *
 * Phase 26: E2E Test Activation
 *
 * 인증 및 권한 관련 E2E 테스트입니다.
 * 미들웨어, API 인증, 세션 관리를 검증합니다.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication - Basic', () => {
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

test.describe('Authentication - Protected Routes', () => {
  test('시스템 메트릭 API는 인증 필요', async ({ request }) => {
    const response = await request.get('/api/system/metrics');
    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  test('관리자 API는 인증 필요', async ({ request }) => {
    const response = await request.get('/api/admin/users');
    expect(response.status()).toBe(401);
  });

  test('여러 admin 하위 경로 접근 시 모두 리다이렉트', async ({ page }) => {
    const adminPaths = [
      '/admin',
      '/admin/projects',
      '/admin/alerts',
      '/admin/containers',
      '/admin/settings',
    ];

    for (const path of adminPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Authentication - Public Routes', () => {
  test('홈페이지는 인증 없이 접근 가능', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('프로젝트 목록 페이지는 인증 없이 접근 가능', async ({ page }) => {
    const response = await page.goto('/projects');
    expect(response?.status()).toBe(200);
  });

  test('서비스 페이지는 인증 없이 접근 가능', async ({ page }) => {
    const response = await page.goto('/services');
    expect(response?.status()).toBe(200);
  });

  test('프로젝트 API는 인증 없이 GET 가능', async ({ request }) => {
    const response = await request.get('/api/projects');
    expect(response.ok()).toBeTruthy();
  });

  test('팀 초대 API는 인증 없이 GET 가능', async ({ request }) => {
    // 공개 초대 조회 API (토큰 필요하지만 인증 불필요)
    const response = await request.get('/api/invites/test-token');
    // 토큰이 없어도 404지 401이 아님 (인증 필요 없음)
    expect(response.status()).not.toBe(401);
  });
});

test.describe('Authentication - Error Response Format', () => {
  test('401 응답에 적절한 에러 코드 포함', async ({ request }) => {
    const response = await request.get('/api/docker/containers');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('code');
    expect(data.code).toBe('UNAUTHORIZED');
  });

  test('로그인 실패 시 일관된 에러 메시지', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { username: 'wrong', password: 'wrong' },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });
});

test.describe('Authentication - Session Behavior', () => {
  test('미인증 상태에서 새로고침해도 여전히 미인증', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);

    // 새로고침
    await page.reload();
    await expect(page).toHaveURL(/\/login/);
  });

  test('쿠키 없으면 모든 보호된 API에서 401', async ({ request }) => {
    const protectedEndpoints = [
      '/api/docker/containers',
      '/api/system/metrics',
      '/api/admin/users',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });

  test('잘못된 쿠키로 API 호출 시 401', async ({ request, page }) => {
    // 잘못된 토큰 쿠키 설정
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'invalid-token-12345',
        domain: 'localhost',
        path: '/',
      },
    ]);

    const response = await request.get('/api/docker/containers');
    expect(response.status()).toBe(401);
  });
});
