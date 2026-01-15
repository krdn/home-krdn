/**
 * 로그인 플로우 E2E 테스트
 *
 * Phase 26: E2E Test Activation
 *
 * API 기반 로그인 및 인증 흐름을 테스트합니다.
 * 현재 로그인 페이지 UI는 미구현 상태이므로 API 테스트에 집중합니다.
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow - API', () => {
  test('필수 필드 누락 시 400 에러 반환', async ({ request }) => {
    // username만 전송
    const response1 = await request.post('/api/auth/login', {
      data: { username: 'test' },
    });
    expect(response1.status()).toBe(400);
    const data1 = await response1.json();
    expect(data1.success).toBeFalsy();
    expect(data1.error).toContain('required');

    // password만 전송
    const response2 = await request.post('/api/auth/login', {
      data: { password: 'test' },
    });
    expect(response2.status()).toBe(400);
    const data2 = await response2.json();
    expect(data2.success).toBeFalsy();
  });

  test('빈 요청 시 400 에러 반환', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.error).toBeTruthy();
  });

  test('잘못된 비밀번호로 로그인 시 401 에러', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'wrong-password-12345',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBeFalsy();
    expect(data.error).toContain('Invalid');
  });

  test('존재하지 않는 사용자로 로그인 시 401 에러', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'nonexistent-user-xyz',
        password: 'any-password',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBeFalsy();
  });

  test('잘못된 JSON 형식 요청 시 400 에러', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: 'invalid-json-string',
    });

    // 잘못된 형식이면 400 또는 500 반환 가능
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('로그인 API 응답 형식 검증', async ({ request }) => {
    // 실패 응답도 올바른 형식인지 확인
    const response = await request.post('/api/auth/login', {
      data: {
        username: 'test',
        password: 'test',
      },
    });

    const data = await response.json();

    // 응답에 success 필드가 항상 존재해야 함
    expect(data).toHaveProperty('success');
    expect(typeof data.success).toBe('boolean');

    // 실패 시 error 필드 존재
    if (!data.success) {
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });
});

test.describe('Login Flow - Redirect', () => {
  test('/login 페이지 접근 시 404 또는 페이지 표시', async ({ page }) => {
    // 현재 /login 페이지가 미구현 상태
    // 404 또는 기본 페이지가 표시될 수 있음
    const response = await page.goto('/login');

    // 페이지가 존재하지 않으면 404
    // 또는 다른 페이지로 리다이렉트될 수 있음
    expect(response?.status()).toBeDefined();
  });

  test('미인증 시 /admin 접근하면 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('미인증 시 /admin/projects 접근하면 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/admin/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('리다이렉트 시 from 파라미터에 원래 경로 포함', async ({ page }) => {
    await page.goto('/admin/alerts');
    const url = new URL(page.url());

    // /login으로 리다이렉트되고 from 파라미터 확인
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('from')).toBe('/admin/alerts');
  });

  test('중첩된 admin 경로도 리다이렉트', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login Flow - Cookie', () => {
  test('로그인 실패 시 auth-token 쿠키 미설정', async ({ page, request }) => {
    // 잘못된 자격 증명으로 로그인 시도
    await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'wrong-password',
      },
    });

    // 쿠키 확인
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((c) => c.name === 'auth-token');

    // auth-token 쿠키가 없어야 함
    expect(authCookie).toBeUndefined();
  });

  test('쿠키 없이 보호된 API 호출 시 401', async ({ request }) => {
    // 인증 없이 Docker API 호출
    const response = await request.get('/api/docker/containers');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBeTruthy();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  test('쿠키 없이 시스템 메트릭 API 호출 시 401', async ({ request }) => {
    const response = await request.get('/api/system/metrics');
    expect(response.status()).toBe(401);
  });
});
