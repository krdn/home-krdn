/**
 * 클라이언트 에러 유틸리티 테스트
 *
 * Phase 27: Error Handling Standardization
 */

import { describe, it, expect } from 'vitest';
import {
  isApiError,
  getErrorMessage,
  getErrorSeverity,
  getErrorField,
  isAuthError,
  type ApiErrorResponse,
} from '../client-errors';

describe('Client Error Utilities', () => {
  describe('isApiError', () => {
    it('should identify API error responses', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: 'Test error',
        code: 'INTERNAL_ERROR',
      };
      expect(isApiError(error)).toBe(true);
    });

    it('should identify API error with details', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      };
      expect(isApiError(error)).toBe(true);
    });

    it('should reject success responses', () => {
      const success = { success: true, data: {} };
      expect(isApiError(success)).toBe(false);
    });

    it('should reject null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('should reject string', () => {
      expect(isApiError('error')).toBe(false);
    });

    it('should reject object without required fields', () => {
      expect(isApiError({ message: 'error' })).toBe(false);
      expect(isApiError({ success: false })).toBe(false);
      expect(isApiError({ error: 'test' })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from ApiErrorResponse', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: 'API error message',
        code: 'INTERNAL_ERROR',
      };
      expect(getErrorMessage(error)).toBe('API error message');
    });

    it('should extract message from Error instance', () => {
      const error = new Error('Standard error');
      expect(getErrorMessage(error)).toBe('Standard error');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다');
      expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다');
      expect(getErrorMessage(123)).toBe('알 수 없는 오류가 발생했습니다');
    });
  });

  describe('getErrorSeverity', () => {
    it('should return warning for validation errors', () => {
      expect(getErrorSeverity('VALIDATION_ERROR')).toBe('warning');
      expect(getErrorSeverity('INVALID_INPUT')).toBe('warning');
      expect(getErrorSeverity('MISSING_FIELD')).toBe('warning');
      expect(getErrorSeverity('INVALID_FORMAT')).toBe('warning');
    });

    it('should return warning for conflict errors', () => {
      expect(getErrorSeverity('CONFLICT')).toBe('warning');
      expect(getErrorSeverity('ALREADY_EXISTS')).toBe('warning');
    });

    it('should return error for auth errors', () => {
      expect(getErrorSeverity('UNAUTHORIZED')).toBe('error');
      expect(getErrorSeverity('FORBIDDEN')).toBe('error');
      expect(getErrorSeverity('TOKEN_EXPIRED')).toBe('error');
    });

    it('should return error for system errors', () => {
      expect(getErrorSeverity('INTERNAL_ERROR')).toBe('error');
      expect(getErrorSeverity('EXTERNAL_SERVICE_ERROR')).toBe('error');
      expect(getErrorSeverity('DATABASE_ERROR')).toBe('error');
    });

    it('should return error for undefined code', () => {
      expect(getErrorSeverity(undefined)).toBe('error');
    });
  });

  describe('getErrorField', () => {
    it('should extract field from API error details', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: 'Invalid email',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      };
      expect(getErrorField(error)).toBe('email');
    });

    it('should return undefined when no field in details', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: 'Error',
        code: 'INTERNAL_ERROR',
      };
      expect(getErrorField(error)).toBeUndefined();
    });

    it('should return undefined for non-API errors', () => {
      expect(getErrorField(new Error('test'))).toBeUndefined();
      expect(getErrorField('string error')).toBeUndefined();
    });
  });

  describe('isAuthError', () => {
    it('should identify auth error codes', () => {
      const cases: Array<[string, boolean]> = [
        ['UNAUTHORIZED', true],
        ['FORBIDDEN', true],
        ['INVALID_CREDENTIALS', true],
        ['TOKEN_EXPIRED', true],
        ['TOKEN_INVALID', true],
        ['SESSION_EXPIRED', true],
        ['VALIDATION_ERROR', false],
        ['NOT_FOUND', false],
        ['INTERNAL_ERROR', false],
      ];

      cases.forEach(([code, expected]) => {
        const error: ApiErrorResponse = {
          success: false,
          error: 'test',
          code: code as ApiErrorResponse['code'],
        };
        expect(isAuthError(error)).toBe(expected);
      });
    });

    it('should return false for non-API errors', () => {
      expect(isAuthError(new Error('test'))).toBe(false);
      expect(isAuthError('string error')).toBe(false);
    });

    it('should handle Error with code property', () => {
      const error = new Error('test') as Error & { code?: string };
      error.code = 'UNAUTHORIZED';
      expect(isAuthError(error)).toBe(true);
    });
  });
});
