/**
 * 커스텀 에러 클래스 계층 구조
 *
 * Phase 27: Error Handling Standardization
 *
 * 타입-세이프한 에러 처리를 위한 커스텀 에러 클래스들을 정의합니다.
 * 모든 앱 에러는 AppError를 상속하며, 일관된 에러 응답 포맷을 보장합니다.
 */

import type { ErrorCode, AuthErrorCode } from './error-codes';

/**
 * 기본 앱 에러 클래스
 *
 * 모든 커스텀 에러의 기반 클래스입니다.
 * - code: 에러 코드 (클라이언트에서 분기 처리용)
 * - statusCode: HTTP 상태 코드
 * - details: 추가 컨텍스트 정보
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    // Error 클래스 상속 시 프로토타입 체인 복원
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * 직렬화용 객체 변환
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * 인증 에러
 *
 * 인증/인가 관련 오류에 사용합니다.
 * - UNAUTHORIZED (401): 인증되지 않음
 * - FORBIDDEN (403): 권한 없음
 * - INVALID_CREDENTIALS: 잘못된 인증 정보
 * - TOKEN_EXPIRED/TOKEN_INVALID: 토큰 관련 오류
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    code: AuthErrorCode = 'UNAUTHORIZED'
  ) {
    const statusCode = code === 'FORBIDDEN' ? 403 : 401;
    super(message, code, statusCode);
    this.name = 'AuthError';
  }
}

/**
 * 검증 에러
 *
 * 입력값 검증 실패 시 사용합니다.
 * - field: 오류가 발생한 필드명 (폼 에러 표시용)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400, field ? { field } : undefined);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found 에러
 *
 * 리소스를 찾을 수 없을 때 사용합니다.
 * - resource: 리소스 종류 (예: 'User', 'Team')
 * - identifier: 식별자 (예: ID, 이름)
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string
  ) {
    const message = identifier
      ? `${resource}(${identifier})를 찾을 수 없습니다`
      : `${resource}를 찾을 수 없습니다`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
    this.name = 'NotFoundError';
  }
}

/**
 * 충돌 에러
 *
 * 리소스 충돌(중복) 시 사용합니다.
 * - field: 충돌이 발생한 필드명 (예: 'email', 'username')
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'CONFLICT', 409, field ? { field } : undefined);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit 에러
 *
 * 요청 제한 초과 시 사용합니다.
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', 429, retryAfter ? { retryAfter } : undefined);
    this.name = 'RateLimitError';
  }
}

/**
 * 외부 서비스 에러
 *
 * 외부 API/서비스 호출 실패 시 사용합니다.
 * - service: 서비스명 (예: 'Email', 'Slack', 'Docker')
 * - originalError: 원본 에러 (로깅용)
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    originalError?: Error
  ) {
    const message = `외부 서비스(${service}) 오류가 발생했습니다`;
    super(message, 'EXTERNAL_SERVICE_ERROR', 503, {
      service,
      originalError: originalError?.message,
    });
    this.name = 'ExternalServiceError';
  }
}

/**
 * 데이터베이스 에러
 *
 * DB 작업 실패 시 사용합니다.
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = '데이터베이스 오류가 발생했습니다',
    originalError?: Error
  ) {
    super(message, 'DATABASE_ERROR', 500, {
      originalError: originalError?.message,
    });
    this.name = 'DatabaseError';
  }
}
