/**
 * 에러 시스템 단위 테스트
 *
 * Phase 27: Error Handling Standardization
 * Phase 33: pino logger mock 적용
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z, ZodError } from 'zod';
import {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
} from '../errors';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandler,
} from '../api-error-handler';
import { ERROR_MESSAGES, getDefaultErrorMessage } from '../error-codes';

// vi.hoisted로 mock 객체 선언 (hoisting 문제 해결)
const mockLogger = vi.hoisted(() => ({
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
}));

vi.mock('../logger', () => ({
  logger: mockLogger,
  Logger: class {
    warn = mockLogger.warn;
    error = mockLogger.error;
    info = mockLogger.info;
    debug = mockLogger.debug;
  },
  createRequestLogger: vi.fn(() => mockLogger),
  createModuleLogger: vi.fn(() => mockLogger),
}));

// logger mock 후 import
import { logError, extractRequestContext, logWarning } from '../error-logger';

// ============================================================
// 커스텀 에러 클래스 테스트
// ============================================================

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'INTERNAL_ERROR', 500);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should support custom details', () => {
      const error = new AppError('Test', 'INTERNAL_ERROR', 500, {
        requestId: '123',
      });

      expect(error.details).toEqual({ requestId: '123' });
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', 'INTERNAL_ERROR', 500, { key: 'value' });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'AppError',
        message: 'Test',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        details: { key: 'value' },
      });
    });
  });

  describe('AuthError', () => {
    it('should default to 401 for UNAUTHORIZED', () => {
      const error = new AuthError('Not authenticated');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('AuthError');
    });

    it('should use 403 for FORBIDDEN', () => {
      const error = new AuthError('No permission', 'FORBIDDEN');

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should use 401 for other auth codes', () => {
      const error = new AuthError('Invalid token', 'TOKEN_INVALID');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('TOKEN_INVALID');
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status code', () => {
      const error = new ValidationError('Invalid email');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should include field in details', () => {
      const error = new ValidationError('Invalid email', 'email');

      expect(error.field).toBe('email');
      expect(error.details?.field).toBe('email');
    });
  });

  describe('NotFoundError', () => {
    it('should format message with resource only', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User를 찾을 수 없습니다');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should format message with resource and identifier', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe('User(123)를 찾을 수 없습니다');
      expect(error.details).toEqual({ resource: 'User', identifier: '123' });
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status code', () => {
      const error = new ConflictError('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should include field in details', () => {
      const error = new ConflictError('Email already exists', 'email');

      expect(error.field).toBe('email');
      expect(error.details?.field).toBe('email');
    });
  });

  describe('RateLimitError', () => {
    it('should have 429 status code with default message', () => {
      const error = new RateLimitError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.message).toContain('요청이 너무 많습니다');
    });

    it('should support retryAfter', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error.retryAfter).toBe(60);
      expect(error.details?.retryAfter).toBe(60);
    });
  });

  describe('ExternalServiceError', () => {
    it('should have 503 status code', () => {
      const error = new ExternalServiceError('Email');

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.message).toContain('Email');
    });

    it('should include original error message', () => {
      const original = new Error('SMTP connection failed');
      const error = new ExternalServiceError('Email', original);

      expect(error.details?.originalError).toBe('SMTP connection failed');
    });
  });

  describe('DatabaseError', () => {
    it('should have 500 status code', () => {
      const error = new DatabaseError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });

    it('should include original error', () => {
      const original = new Error('Connection refused');
      const error = new DatabaseError('DB error', original);

      expect(error.details?.originalError).toBe('Connection refused');
    });
  });
});

// ============================================================
// API 에러 핸들러 테스트
// ============================================================

describe('API Error Handler', () => {
  describe('createErrorResponse', () => {
    it('should handle AppError correctly', async () => {
      const error = new AuthError('Invalid token', 'TOKEN_INVALID');
      const response = createErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid token');
      expect(body.code).toBe('TOKEN_INVALID');
    });

    it('should handle ValidationError with field', async () => {
      const error = new ValidationError('이메일 형식 오류', 'email');
      const response = createErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details?.field).toBe('email');
    });

    it('should handle ZodError correctly', async () => {
      const schema = z.object({ email: z.string().email('유효한 이메일을 입력하세요') });

      let zodError: ZodError | undefined;
      try {
        schema.parse({ email: 'invalid' });
      } catch (e) {
        zodError = e as ZodError;
      }

      const response = createErrorResponse(zodError);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details?.field).toBe('email');
      expect(body.details?.issues).toBeDefined();
    });

    it('should handle SyntaxError as invalid input', async () => {
      const error = new SyntaxError('Unexpected token');
      const response = createErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('INVALID_INPUT');
      expect(body.error).toBe('잘못된 요청 본문입니다');
    });

    it('should handle generic Error', async () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('should handle unknown errors safely', async () => {
      const response = createErrorResponse('string error');
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.error).toBe('서버 오류가 발생했습니다');
    });

    it('should use custom default message', async () => {
      const response = createErrorResponse(null, '커스텀 에러 메시지');
      const body = await response.json();

      expect(body.error).toBe('커스텀 에러 메시지');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('should support custom status code', async () => {
      const response = createSuccessResponse({ id: 1 }, 201);

      expect(response.status).toBe(201);
    });
  });

  describe('withErrorHandler', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should pass through successful responses', async () => {
      const { NextResponse } = await import('next/server');
      const handler = async () => NextResponse.json({ success: true, data: 'ok' });

      const response = await withErrorHandler(handler);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toBe('ok');
    });

    it('should catch and handle errors', async () => {
      const handler = async () => {
        throw new ValidationError('Invalid input');
      };

      const response = await withErrorHandler(handler);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should log errors with context', async () => {
      const handler = async () => {
        throw new Error('Test error');
      };

      await withErrorHandler(handler, { path: '/api/test', method: 'POST' });

      // pino logger mock으로 로깅 확인
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

// ============================================================
// 에러 로거 테스트
// ============================================================

describe('Error Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('should log AppError with correct level', () => {
      const error = new AppError('Server error', 'INTERNAL_ERROR', 500);
      logError(error);

      // 500 에러는 error 레벨로 로깅
      expect(mockLogger.error).toHaveBeenCalled();
      const [message, context] = mockLogger.error.mock.calls[0];
      expect(message).toContain('Server error');
      expect(context.code).toBe('INTERNAL_ERROR');
    });

    it('should log 4xx errors as warnings', () => {
      const error = new ValidationError('Bad input');
      logError(error);

      // 4xx 에러는 warn 레벨로 로깅
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should include context in log', () => {
      const error = new Error('Test');
      logError(error, { path: '/api/users', method: 'POST', userId: '123' });

      expect(mockLogger.error).toHaveBeenCalled();
      const [, context] = mockLogger.error.mock.calls[0];
      expect(context.path).toBe('/api/users');
      expect(context.method).toBe('POST');
      expect(context.userId).toBe('123');
    });

    it('should handle string errors', () => {
      logError('String error message');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'String error message',
        expect.any(Object)
      );
    });
  });

  describe('extractRequestContext', () => {
    it('should extract path and method from request', () => {
      const request = new Request('https://example.com/api/users', {
        method: 'POST',
      });

      const context = extractRequestContext(request);

      expect(context.path).toBe('/api/users');
      expect(context.method).toBe('POST');
    });
  });

  describe('logWarning', () => {
    it('should log with warn level', () => {
      logWarning('This is a warning');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'This is a warning',
        undefined
      );
    });
  });
});

// ============================================================
// 에러 코드 테스트
// ============================================================

describe('Error Codes', () => {
  describe('ERROR_MESSAGES', () => {
    it('should have message for all error codes', () => {
      const codes = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'SESSION_EXPIRED',
        'VALIDATION_ERROR',
        'INVALID_INPUT',
        'MISSING_FIELD',
        'INVALID_FORMAT',
        'NOT_FOUND',
        'CONFLICT',
        'ALREADY_EXISTS',
        'INTERNAL_ERROR',
        'EXTERNAL_SERVICE_ERROR',
        'RATE_LIMIT',
        'DATABASE_ERROR',
      ];

      codes.forEach((code) => {
        expect(ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES]).toBe(
          'string'
        );
      });
    });
  });

  describe('getDefaultErrorMessage', () => {
    it('should return correct message for code', () => {
      expect(getDefaultErrorMessage('UNAUTHORIZED')).toBe('인증이 필요합니다');
      expect(getDefaultErrorMessage('NOT_FOUND')).toBe(
        '리소스를 찾을 수 없습니다'
      );
    });
  });
});
