/**
 * Auth Session API Route 테스트
 * GET /api/auth/session - 세션 정보 반환
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// auth.ts 모듈 mocking
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}));

// route import 후 mock 가져오기
import { GET } from './route';
import * as authModule from '@/lib/auth';

/**
 * NextRequest를 생성하는 헬퍼 함수
 * cookies() 메서드를 직접 mock 처리
 */
function createMockRequest(tokenValue?: string): NextRequest {
  const request = new NextRequest('http://localhost/api/auth/session');

  // cookies.get을 직접 mock 처리
  if (tokenValue) {
    vi.spyOn(request.cookies, 'get').mockImplementation((name: string) => {
      if (name === 'auth-token') {
        return { name: 'auth-token', value: tokenValue };
      }
      return undefined;
    });
  } else {
    vi.spyOn(request.cookies, 'get').mockReturnValue(undefined);
  }

  return request;
}

describe('GET /api/auth/session', () => {
  const mockVerifyToken = authModule.verifyToken as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('토큰이 없는 경우', () => {
    it('authenticated: false와 401 상태를 반환해야 한다', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });
  });

  describe('유효한 토큰인 경우', () => {
    it('authenticated: true와 사용자 정보를 반환해야 한다', async () => {
      // Arrange
      const mockPayload = {
        userId: 'admin-001',
        username: 'admin',
        role: 'admin' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15분 후 만료
      };
      mockVerifyToken.mockResolvedValue({ valid: true, payload: mockPayload });

      const request = createMockRequest('valid-token-here');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.userId).toBe('admin-001');
      expect(data.user.username).toBe('admin');
      expect(data.user.role).toBe('admin');
    });

    it('verifyToken에 올바른 토큰이 전달되어야 한다', async () => {
      // Arrange
      const mockPayload = {
        userId: 'test-user',
        username: 'testuser',
        role: 'user' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      mockVerifyToken.mockResolvedValue({ valid: true, payload: mockPayload });

      const request = createMockRequest('my-specific-token');

      // Act
      await GET(request);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith('my-specific-token');
    });
  });

  describe('유효하지 않은 토큰인 경우', () => {
    it('토큰 검증 실패 시 authenticated: false와 401 상태를 반환해야 한다', async () => {
      // Arrange
      mockVerifyToken.mockResolvedValue({ valid: false, error: '유효하지 않은 토큰 서명' });

      const request = createMockRequest('invalid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('만료된 토큰인 경우 authenticated: false를 반환해야 한다', async () => {
      // Arrange
      mockVerifyToken.mockResolvedValue({ valid: false, error: '토큰이 만료되었습니다' });

      const request = createMockRequest('expired-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('예외 처리', () => {
    it('verifyToken에서 예외 발생 시 에러 응답을 반환해야 한다', async () => {
      // Arrange
      mockVerifyToken.mockRejectedValue(new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다'));

      const request = createMockRequest('some-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Not authenticated');
    });

    it('예상치 못한 에러도 올바르게 처리해야 한다', async () => {
      // Arrange
      mockVerifyToken.mockRejectedValue('Unknown error');

      const request = createMockRequest('some-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
    });
  });
});
