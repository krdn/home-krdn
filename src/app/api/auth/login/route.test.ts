/**
 * Auth Login API Route 테스트
 * POST /api/auth/login - 로그인 인증
 *
 * Phase 25: Test Coverage Expansion
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// 모듈 mocking
vi.mock('@/lib/auth', () => ({
  authenticateUserFromDB: vi.fn(),
}));

vi.mock('@/lib/user-service', () => ({
  findUserByUsername: vi.fn(),
  toUserDto: vi.fn(),
}));

// route import 후 mock 가져오기
import { POST } from './route';
import * as authModule from '@/lib/auth';
import * as userServiceModule from '@/lib/user-service';

/**
 * POST 요청을 생성하는 헬퍼 함수
 */
function createLoginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * 유효하지 않은 JSON body를 가진 요청 생성
 */
function createInvalidJsonRequest(): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json',
  });
}

describe('POST /api/auth/login', () => {
  const mockAuthenticateUserFromDB = authModule.authenticateUserFromDB as Mock;
  const mockFindUserByUsername = userServiceModule.findUserByUsername as Mock;
  const mockToUserDto = userServiceModule.toUserDto as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('올바른 자격 증명으로 로그인 시 200과 success: true를 반환해야 한다', async () => {
      // Arrange
      const mockUser = {
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockUserDto = {
        id: 'user-001',
        username: 'testuser',
        role: 'user',
      };

      mockAuthenticateUserFromDB.mockResolvedValue({
        success: true,
        token: 'jwt-token-here',
      });
      mockFindUserByUsername.mockResolvedValue(mockUser);
      mockToUserDto.mockReturnValue(mockUserDto);

      const request = createLoginRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe('testuser');
    });

    it('로그인 성공 시 auth-token 쿠키가 설정되어야 한다', async () => {
      // Arrange
      const mockUser = {
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
      };
      const mockUserDto = {
        id: 'user-001',
        username: 'testuser',
        role: 'user',
      };

      mockAuthenticateUserFromDB.mockResolvedValue({
        success: true,
        token: 'jwt-token-here',
      });
      mockFindUserByUsername.mockResolvedValue(mockUser);
      mockToUserDto.mockReturnValue(mockUserDto);

      const request = createLoginRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      // Act
      const response = await POST(request);

      // Assert
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('auth-token=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Path=/');
    });

    it('응답에 user 객체가 올바른 구조로 포함되어야 한다', async () => {
      // Arrange
      const mockUser = {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      };
      const mockUserDto = {
        id: 'admin-001',
        username: 'admin',
        role: 'admin',
      };

      mockAuthenticateUserFromDB.mockResolvedValue({
        success: true,
        token: 'jwt-token',
      });
      mockFindUserByUsername.mockResolvedValue(mockUser);
      mockToUserDto.mockReturnValue(mockUserDto);

      const request = createLoginRequest({
        username: 'admin',
        password: 'adminpass',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.user).toEqual({
        username: 'admin',
        role: 'admin',
      });
    });
  });

  describe('인증 실패 케이스', () => {
    it('잘못된 비밀번호로 로그인 시 401을 반환해야 한다', async () => {
      // Arrange
      mockAuthenticateUserFromDB.mockResolvedValue({
        success: false,
        error: 'Invalid password',
      });

      const request = createLoginRequest({
        username: 'testuser',
        password: 'wrongpassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('존재하지 않는 사용자로 로그인 시 401을 반환해야 한다', async () => {
      // Arrange
      mockAuthenticateUserFromDB.mockResolvedValue({
        success: false,
        error: 'User not found',
      });

      const request = createLoginRequest({
        username: 'nonexistent',
        password: 'somepassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('인증 성공 후 사용자 조회 실패 시 401을 반환해야 한다', async () => {
      // Arrange
      mockAuthenticateUserFromDB.mockResolvedValue({
        success: true,
        token: 'jwt-token',
      });
      mockFindUserByUsername.mockResolvedValue(null);

      const request = createLoginRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });
  });

  describe('입력 검증', () => {
    it('username이 없으면 400을 반환해야 한다', async () => {
      // Arrange
      const request = createLoginRequest({
        password: 'somepassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username and password required');
    });

    it('password가 없으면 400을 반환해야 한다', async () => {
      // Arrange
      const request = createLoginRequest({
        username: 'testuser',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username and password required');
    });

    it('빈 문자열 username과 password는 400을 반환해야 한다', async () => {
      // Arrange
      const request = createLoginRequest({
        username: '',
        password: '',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Username and password required');
    });
  });

  describe('에러 처리', () => {
    it('유효하지 않은 JSON body는 400을 반환해야 한다', async () => {
      // Arrange
      const request = createInvalidJsonRequest();

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body');
    });

    it('인증 함수에서 예외 발생 시 500을 반환해야 한다', async () => {
      // Arrange
      mockAuthenticateUserFromDB.mockRejectedValue(new Error('Database error'));

      const request = createLoginRequest({
        username: 'testuser',
        password: 'somepassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('예상치 못한 에러도 500으로 처리해야 한다', async () => {
      // Arrange
      mockAuthenticateUserFromDB.mockRejectedValue('Unknown error type');

      const request = createLoginRequest({
        username: 'testuser',
        password: 'somepassword',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
