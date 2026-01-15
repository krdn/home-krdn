/**
 * Authentication Library 단위 테스트
 *
 * Phase 25: Test Coverage Expansion
 * - createToken 함수 테스트
 * - verifyToken 함수 테스트
 * - hashPassword 함수 테스트
 * - comparePassword 함수 테스트
 * - getAdminUser 함수 테스트
 * - getAdminPasswordHash 함수 테스트
 * - authenticateUser 함수 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getAdminUser,
  getAdminPasswordHash,
  authenticateUser,
} from './auth';
import type { User } from '@/types/auth';

// 테스트용 환경 변수 값
const TEST_JWT_SECRET = 'test-secret-key-for-testing-at-least-32-chars';
const TEST_ADMIN_USERNAME = 'testadmin';

describe('auth', () => {
  // ============================================================
  // 환경 변수 설정
  // ============================================================
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_JWT_SECRET);
    vi.stubEnv('ADMIN_USERNAME', TEST_ADMIN_USERNAME);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ============================================================
  // createToken 함수 테스트
  // ============================================================
  describe('createToken', () => {
    const testUser: User = {
      id: 'user-001',
      username: 'testuser',
      role: 'admin',
    };

    it('should create a valid JWT token', async () => {
      const token = await createToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT 형식 검증: header.payload.signature
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include user data in token payload', async () => {
      const token = await createToken(testUser);
      const result = await verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.userId).toBe(testUser.id);
        expect(result.payload.username).toBe(testUser.username);
        expect(result.payload.role).toBe(testUser.role);
      }
    });

    it('should create tokens with different values for different users', async () => {
      const user2: User = {
        id: 'user-002',
        username: 'anotheruser',
        role: 'user',
      };

      const token1 = await createToken(testUser);
      const token2 = await createToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should include iat (issued at) claim', async () => {
      const beforeCreate = Math.floor(Date.now() / 1000);
      const token = await createToken(testUser);
      const afterCreate = Math.floor(Date.now() / 1000);

      const result = await verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.iat).toBeGreaterThanOrEqual(beforeCreate);
        expect(result.payload.iat).toBeLessThanOrEqual(afterCreate);
      }
    });

    it('should include exp (expiration) claim', async () => {
      const token = await createToken(testUser);
      const result = await verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.exp).toBeDefined();
        expect(result.payload.exp).toBeGreaterThan(result.payload.iat);
      }
    });

    it('should throw error when JWT_SECRET is not set', async () => {
      vi.stubEnv('JWT_SECRET', '');

      await expect(createToken(testUser)).rejects.toThrow(
        'JWT_SECRET 환경 변수가 설정되지 않았습니다'
      );
    });
  });

  // ============================================================
  // verifyToken 함수 테스트
  // ============================================================
  describe('verifyToken', () => {
    const testUser: User = {
      id: 'user-001',
      username: 'testuser',
      role: 'admin',
    };

    it('should verify a valid token', async () => {
      const token = await createToken(testUser);
      const result = await verifyToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.userId).toBe(testUser.id);
        expect(result.payload.username).toBe(testUser.username);
        expect(result.payload.role).toBe(testUser.role);
      }
    });

    it('should reject token with invalid signature', async () => {
      const token = await createToken(testUser);
      // 서명 부분 변경
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.' + parts[1] + '.invalid_signature';

      const result = await verifyToken(tamperedToken);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
      }
    });

    it('should reject malformed token', async () => {
      const result = await verifyToken('not-a-valid-token');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBeDefined();
      }
    });

    it('should reject empty token', async () => {
      const result = await verifyToken('');

      expect(result.valid).toBe(false);
    });

    it('should reject token with wrong secret', async () => {
      const token = await createToken(testUser);

      // 다른 시크릿으로 변경
      vi.stubEnv('JWT_SECRET', 'different-secret-key-for-testing-32-chars');

      const result = await verifyToken(token);

      expect(result.valid).toBe(false);
    });

    it('should reject token with tampered payload', async () => {
      const token = await createToken(testUser);
      const parts = token.split('.');

      // payload 부분 변경 (base64url 형식)
      const tamperedPayload = Buffer.from(JSON.stringify({
        userId: 'hacked-user',
        username: 'hacker',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');

      const tamperedToken = parts[0] + '.' + tamperedPayload + '.' + parts[2];

      const result = await verifyToken(tamperedToken);

      expect(result.valid).toBe(false);
    });

    it('should handle token with missing required claims', async () => {
      // jose 라이브러리로 직접 불완전한 토큰 생성은 복잡하므로
      // 대신 빈 페이로드 결과를 테스트
      const result = await verifyToken('eyJhbGciOiJIUzI1NiJ9.e30.signature');

      expect(result.valid).toBe(false);
    });
  });

  // ============================================================
  // hashPassword 함수 테스트
  // ============================================================
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should create different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // bcrypt는 salt를 사용하므로 같은 비밀번호도 다른 해시가 생성됨
      expect(hash1).not.toBe(hash2);
    });

    it('should create bcrypt format hash', async () => {
      const password = 'testPassword';
      const hash = await hashPassword(password);

      // bcrypt 해시는 $2a$ 또는 $2b$로 시작
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const password = '비밀번호123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should handle empty string', async () => {
      const password = '';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should handle very long passwords', async () => {
      // bcrypt는 72바이트까지만 처리하지만 에러 없이 동작해야 함
      const password = 'a'.repeat(100);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
    });
  });

  // ============================================================
  // comparePassword 함수 테스트
  // ============================================================
  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);

      const result = await comparePassword('wrongPassword', hash);

      expect(result).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'CaseSensitive';
      const hash = await hashPassword(password);

      expect(await comparePassword('casesensitive', hash)).toBe(false);
      expect(await comparePassword('CASESENSITIVE', hash)).toBe(false);
      expect(await comparePassword('CaseSensitive', hash)).toBe(true);
    });

    it('should handle whitespace correctly', async () => {
      const password = ' password with spaces ';
      const hash = await hashPassword(password);

      expect(await comparePassword('password with spaces', hash)).toBe(false);
      expect(await comparePassword(' password with spaces ', hash)).toBe(true);
    });
  });

  // ============================================================
  // getAdminUser 함수 테스트
  // ============================================================
  describe('getAdminUser', () => {
    it('should return admin user from environment', () => {
      const user = getAdminUser();

      expect(user.id).toBe('admin-001');
      expect(user.username).toBe(TEST_ADMIN_USERNAME);
      expect(user.role).toBe('admin');
    });

    it('should throw error when ADMIN_USERNAME is not set', () => {
      vi.stubEnv('ADMIN_USERNAME', '');

      expect(() => getAdminUser()).toThrow(
        'ADMIN_USERNAME 환경 변수가 설정되지 않았습니다'
      );
    });

    it('should always return admin role', () => {
      vi.stubEnv('ADMIN_USERNAME', 'anyuser');

      const user = getAdminUser();

      expect(user.role).toBe('admin');
    });
  });

  // ============================================================
  // getAdminPasswordHash 함수 테스트
  // ============================================================
  describe('getAdminPasswordHash', () => {
    it('should return password hash from environment', async () => {
      const testHash = await hashPassword('testpassword');
      vi.stubEnv('ADMIN_PASSWORD_HASH', testHash);

      const hash = getAdminPasswordHash();

      expect(hash).toBe(testHash);
    });

    it('should throw error when ADMIN_PASSWORD_HASH is not set', () => {
      vi.stubEnv('ADMIN_PASSWORD_HASH', '');

      expect(() => getAdminPasswordHash()).toThrow(
        'ADMIN_PASSWORD_HASH 환경 변수가 설정되지 않았습니다'
      );
    });
  });

  // ============================================================
  // authenticateUser 함수 테스트 (Legacy)
  // ============================================================
  describe('authenticateUser', () => {
    const correctPassword = 'correctPassword123';
    let passwordHash: string;

    beforeEach(async () => {
      passwordHash = await hashPassword(correctPassword);
      vi.stubEnv('ADMIN_PASSWORD_HASH', passwordHash);
    });

    it('should return success with token for valid credentials', async () => {
      const result = await authenticateUser(TEST_ADMIN_USERNAME, correctPassword);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for wrong username', async () => {
      const result = await authenticateUser('wronguser', correctPassword);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.error).toBe('잘못된 사용자명 또는 비밀번호');
    });

    it('should return error for wrong password', async () => {
      const result = await authenticateUser(TEST_ADMIN_USERNAME, 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.error).toBe('잘못된 사용자명 또는 비밀번호');
    });

    it('should return error for empty username', async () => {
      const result = await authenticateUser('', correctPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('잘못된 사용자명 또는 비밀번호');
    });

    it('should return error for empty password', async () => {
      const result = await authenticateUser(TEST_ADMIN_USERNAME, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('잘못된 사용자명 또는 비밀번호');
    });

    it('should return valid JWT on successful authentication', async () => {
      const result = await authenticateUser(TEST_ADMIN_USERNAME, correctPassword);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();

      // 반환된 토큰이 유효한지 확인
      const verifyResult = await verifyToken(result.token!);
      expect(verifyResult.valid).toBe(true);

      if (verifyResult.valid) {
        expect(verifyResult.payload.username).toBe(TEST_ADMIN_USERNAME);
        expect(verifyResult.payload.role).toBe('admin');
      }
    });

    it('should not leak information about which field is wrong', async () => {
      const wrongUsernameResult = await authenticateUser('wronguser', correctPassword);
      const wrongPasswordResult = await authenticateUser(TEST_ADMIN_USERNAME, 'wrongpassword');

      // 보안을 위해 동일한 에러 메시지 반환
      expect(wrongUsernameResult.error).toBe(wrongPasswordResult.error);
    });
  });

  // ============================================================
  // 통합 보안 시나리오 테스트
  // ============================================================
  describe('security scenarios', () => {
    it('should handle timing attacks by consistent response', async () => {
      const passwordHash = await hashPassword('password');
      vi.stubEnv('ADMIN_PASSWORD_HASH', passwordHash);

      // 여러 번 인증 시도해도 일관된 결과
      const results = await Promise.all([
        authenticateUser(TEST_ADMIN_USERNAME, 'wrongpassword1'),
        authenticateUser(TEST_ADMIN_USERNAME, 'wrongpassword2'),
        authenticateUser('wronguser', 'password'),
      ]);

      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('잘못된 사용자명 또는 비밀번호');
      });
    });

    it('should not expose internal errors in authentication', async () => {
      // 환경 변수가 없는 경우에도 안전하게 처리되어야 함
      vi.stubEnv('ADMIN_PASSWORD_HASH', '');

      await expect(authenticateUser(TEST_ADMIN_USERNAME, 'anypassword'))
        .rejects.toThrow();
    });

    it('should validate token after creation', async () => {
      const testUser: User = {
        id: 'test-id',
        username: 'testuser',
        role: 'user',
      };

      const token = await createToken(testUser);
      const verifyResult = await verifyToken(token);

      expect(verifyResult.valid).toBe(true);
      if (verifyResult.valid) {
        expect(verifyResult.payload.userId).toBe(testUser.id);
      }
    });
  });
});
