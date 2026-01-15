/**
 * Auth Register API Route 테스트
 * POST /api/auth/register - 회원가입
 *
 * Phase 25: Test Coverage Expansion
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// 모듈 mocking
vi.mock('@/lib/auth', () => ({
  createToken: vi.fn(),
}));

vi.mock('@/lib/user-service', () => ({
  createUser: vi.fn(),
  isEmailTaken: vi.fn(),
  isUsernameTaken: vi.fn(),
  findUserByUsername: vi.fn(),
  toUserDto: vi.fn(),
  RegisterInputSchema: {
    safeParse: vi.fn(),
  },
}));

// route import 후 mock 가져오기
import { POST } from './route';
import * as authModule from '@/lib/auth';
import * as userServiceModule from '@/lib/user-service';

/**
 * POST 요청을 생성하는 헬퍼 함수
 */
function createRegisterRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
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
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: 'invalid json',
  });
}

describe('POST /api/auth/register', () => {
  const mockCreateToken = authModule.createToken as Mock;
  const mockCreateUser = userServiceModule.createUser as Mock;
  const mockIsEmailTaken = userServiceModule.isEmailTaken as Mock;
  const mockIsUsernameTaken = userServiceModule.isUsernameTaken as Mock;
  const mockFindUserByUsername = userServiceModule.findUserByUsername as Mock;
  const mockToUserDto = userServiceModule.toUserDto as Mock;
  const mockRegisterInputSchema = userServiceModule.RegisterInputSchema as {
    safeParse: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('새 사용자 등록 시 201과 success: true를 반환해야 한다', async () => {
      // Arrange
      const input = {
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'securepass123',
        displayName: 'New User',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-001',
        username: 'newuser',
        email: 'newuser@test.com',
        role: 'USER',
        displayName: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockFindUserByUsername.mockResolvedValue({
        id: 'user-001',
        username: 'newuser',
        email: 'newuser@test.com',
        role: 'USER',
      });
      mockToUserDto.mockReturnValue({
        id: 'user-001',
        username: 'newuser',
        role: 'user',
      });
      mockCreateToken.mockResolvedValue('jwt-token-here');

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    it('응답에 비밀번호가 포함되지 않아야 한다', async () => {
      // Arrange
      const input = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'securepass123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
      });
      mockFindUserByUsername.mockResolvedValue({
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
      });
      mockToUserDto.mockReturnValue({
        id: 'user-001',
        username: 'testuser',
        role: 'user',
      });
      mockCreateToken.mockResolvedValue('jwt-token');

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.user.password).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('등록 성공 시 auth-token 쿠키가 설정되어야 한다 (자동 로그인)', async () => {
      // Arrange
      const input = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'securepass123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
      });
      mockFindUserByUsername.mockResolvedValue({
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
      });
      mockToUserDto.mockReturnValue({
        id: 'user-001',
        username: 'testuser',
        role: 'user',
      });
      mockCreateToken.mockResolvedValue('jwt-token-for-new-user');

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);

      // Assert
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('auth-token=');
      expect(setCookie).toContain('HttpOnly');
    });

    it('응답에 사용자 정보가 올바른 구조로 포함되어야 한다', async () => {
      // Arrange
      const input = {
        email: 'new@test.com',
        username: 'newbie',
        password: 'password123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-002',
        username: 'newbie',
        email: 'new@test.com',
        role: 'USER',
      });
      mockFindUserByUsername.mockResolvedValue({
        id: 'user-002',
        username: 'newbie',
        email: 'new@test.com',
        role: 'USER',
      });
      mockToUserDto.mockReturnValue({
        id: 'user-002',
        username: 'newbie',
        role: 'user',
      });
      mockCreateToken.mockResolvedValue('jwt-token');

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.user).toEqual({
        id: 'user-002',
        username: 'newbie',
        email: 'new@test.com',
        role: 'user',
      });
    });
  });

  describe('중복 검사', () => {
    it('이미 존재하는 이메일이면 409를 반환해야 한다', async () => {
      // Arrange
      const input = {
        email: 'existing@test.com',
        username: 'newuser',
        password: 'securepass123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(true);

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('이미 사용 중인 이메일입니다');
    });

    it('이미 존재하는 사용자명이면 409를 반환해야 한다', async () => {
      // Arrange
      const input = {
        email: 'new@test.com',
        username: 'existinguser',
        password: 'securepass123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(true);

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('이미 사용 중인 사용자명입니다');
    });
  });

  describe('입력 검증', () => {
    it('유효하지 않은 이메일 형식은 400을 반환해야 한다', async () => {
      // Arrange
      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['email'], message: '유효한 이메일 주소를 입력해주세요' },
          ],
        },
      });

      const request = createRegisterRequest({
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.field).toBe('email');
    });

    it('너무 짧은 비밀번호는 400을 반환해야 한다', async () => {
      // Arrange
      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['password'], message: '비밀번호는 최소 8자 이상이어야 합니다' },
          ],
        },
      });

      const request = createRegisterRequest({
        email: 'test@test.com',
        username: 'testuser',
        password: 'short',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('비밀번호');
    });

    it('너무 짧은 사용자명은 400을 반환해야 한다', async () => {
      // Arrange
      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['username'], message: '사용자명은 최소 3자 이상이어야 합니다' },
          ],
        },
      });

      const request = createRegisterRequest({
        email: 'test@test.com',
        username: 'ab',
        password: 'password123',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.field).toBe('username');
    });

    it('특수문자가 포함된 사용자명은 400을 반환해야 한다', async () => {
      // Arrange
      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            {
              path: ['username'],
              message: '사용자명은 영문, 숫자, 밑줄(_)만 사용할 수 있습니다',
            },
          ],
        },
      });

      const request = createRegisterRequest({
        email: 'test@test.com',
        username: 'test@user!',
        password: 'password123',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
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

    it('사용자 생성 중 에러 발생 시 500을 반환해야 한다', async () => {
      // Arrange
      const input = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockRejectedValue(new Error('Database error'));

      const request = createRegisterRequest(input);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('생성 후 사용자 조회 실패 시 500을 반환해야 한다', async () => {
      // Arrange
      const input = {
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      };

      mockRegisterInputSchema.safeParse.mockReturnValue({
        success: true,
        data: input,
      });
      mockIsEmailTaken.mockResolvedValue(false);
      mockIsUsernameTaken.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: 'user-001',
        username: 'testuser',
        email: 'test@test.com',
      });
      mockFindUserByUsername.mockResolvedValue(null);

      const request = createRegisterRequest(input);

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
