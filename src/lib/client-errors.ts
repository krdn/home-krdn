/**
 * 클라이언트용 에러 유틸리티
 *
 * Phase 27: Error Handling Standardization
 *
 * React 컴포넌트와 훅에서 사용하는 에러 처리 유틸리티입니다.
 */

import type { ErrorCode } from './error-codes';

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * 클라이언트에서 사용하는 에러 타입
 */
export interface ClientError extends Error {
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * API 응답이 에러인지 확인
 *
 * @param response - API 응답 객체
 * @returns 에러 응답 여부
 *
 * @example
 * ```typescript
 * const data = await response.json();
 * if (isApiError(data)) {
 *   showToast({ severity: 'error', title: data.error });
 * }
 * ```
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'string'
  );
}

/**
 * 에러 객체에서 사용자 친화적 메시지 추출
 *
 * @param error - 에러 객체 (Error, ApiErrorResponse, unknown)
 * @returns 사용자에게 표시할 메시지
 *
 * @example
 * ```typescript
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   showToast({ severity: 'error', title: getErrorMessage(error) });
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러 코드에 따른 토스트 심각도 결정
 *
 * 사용자 입력 오류(400 계열)는 warning, 시스템 오류(500 계열)는 error
 *
 * @param code - 에러 코드
 * @returns 토스트 심각도
 *
 * @example
 * ```typescript
 * const severity = getErrorSeverity(error.code);
 * showToast({ severity, title: error.error });
 * ```
 */
export function getErrorSeverity(
  code: ErrorCode | undefined
): 'error' | 'warning' {
  if (!code) return 'error';

  // 사용자 입력 오류는 warning (수정 가능한 오류)
  const warningCodes: ErrorCode[] = [
    'VALIDATION_ERROR',
    'INVALID_INPUT',
    'MISSING_FIELD',
    'INVALID_FORMAT',
    'CONFLICT',
    'ALREADY_EXISTS',
  ];

  return warningCodes.includes(code) ? 'warning' : 'error';
}

/**
 * fetch 응답을 파싱하고 에러 처리
 *
 * @param response - fetch Response 객체
 * @returns 파싱된 데이터
 * @throws 에러 응답인 경우 ClientError를 throw
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/users');
 * const data = await parseApiResponse<User[]>(response);
 * ```
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok || isApiError(data)) {
    const error: ClientError = new Error(
      isApiError(data) ? data.error : 'API 요청 실패'
    );
    if (isApiError(data)) {
      error.code = data.code;
      error.details = data.details;
    }
    throw error;
  }

  return data;
}

/**
 * 에러 코드에 따른 필드명 추출
 *
 * 폼 에러 표시에 유용
 *
 * @param error - 에러 객체
 * @returns 에러가 발생한 필드명 (없으면 undefined)
 */
export function getErrorField(error: unknown): string | undefined {
  if (isApiError(error) && error.details?.field) {
    return String(error.details.field);
  }
  return undefined;
}

/**
 * 인증 관련 에러인지 확인
 *
 * @param error - 에러 객체
 * @returns 인증 에러 여부
 */
export function isAuthError(error: unknown): boolean {
  if (isApiError(error)) {
    const authCodes: ErrorCode[] = [
      'UNAUTHORIZED',
      'FORBIDDEN',
      'INVALID_CREDENTIALS',
      'TOKEN_EXPIRED',
      'TOKEN_INVALID',
      'SESSION_EXPIRED',
    ];
    return authCodes.includes(error.code);
  }

  if (error instanceof Error && 'code' in error) {
    return ['UNAUTHORIZED', 'FORBIDDEN'].includes((error as ClientError).code ?? '');
  }

  return false;
}
