/**
 * 에러 코드 상수 및 메시지 정의
 *
 * Phase 27: Error Handling Standardization
 *
 * 타입-세이프한 에러 코드와 사용자 친화적 메시지 매핑을 제공합니다.
 */

// 인증 관련 에러 코드
export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'SESSION_EXPIRED';

// 검증 관련 에러 코드
export type ValidationErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_FIELD'
  | 'INVALID_FORMAT';

// 리소스 관련 에러 코드
export type ResourceErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ALREADY_EXISTS';

// 시스템 관련 에러 코드
export type SystemErrorCode =
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'RATE_LIMIT'
  | 'DATABASE_ERROR';

// 모든 에러 코드 통합 타입
export type ErrorCode =
  | AuthErrorCode
  | ValidationErrorCode
  | ResourceErrorCode
  | SystemErrorCode;

/**
 * 에러 코드별 기본 메시지
 *
 * 사용자에게 표시되는 메시지이므로 한국어로 작성
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth
  UNAUTHORIZED: '인증이 필요합니다',
  FORBIDDEN: '권한이 부족합니다',
  INVALID_CREDENTIALS: '잘못된 인증 정보입니다',
  TOKEN_EXPIRED: '토큰이 만료되었습니다',
  TOKEN_INVALID: '유효하지 않은 토큰입니다',
  SESSION_EXPIRED: '세션이 만료되었습니다',
  // Validation
  VALIDATION_ERROR: '입력값이 올바르지 않습니다',
  INVALID_INPUT: '잘못된 입력입니다',
  MISSING_FIELD: '필수 필드가 누락되었습니다',
  INVALID_FORMAT: '형식이 올바르지 않습니다',
  // Resource
  NOT_FOUND: '리소스를 찾을 수 없습니다',
  CONFLICT: '리소스 충돌이 발생했습니다',
  ALREADY_EXISTS: '이미 존재하는 리소스입니다',
  // System
  INTERNAL_ERROR: '서버 오류가 발생했습니다',
  EXTERNAL_SERVICE_ERROR: '외부 서비스 오류가 발생했습니다',
  RATE_LIMIT: '요청이 너무 많습니다',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다',
};

/**
 * 에러 코드로 기본 메시지 조회
 */
export function getDefaultErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}
