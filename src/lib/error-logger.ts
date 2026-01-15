/**
 * 에러 로깅 유틸리티
 *
 * Phase 27: Error Handling Standardization
 *
 * 구조화된 에러 로깅을 제공합니다.
 * JSON 형식으로 로깅하여 향후 로그 집계 도구와 호환됩니다.
 */

import { AppError } from './errors';

/**
 * 에러 로그 컨텍스트
 */
export interface ErrorLogContext {
  path?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * 에러 로그 엔트리
 */
interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn';
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  context?: ErrorLogContext;
}

/**
 * 구조화된 에러 로깅
 *
 * @param error - 로깅할 에러 객체
 * @param context - 추가 컨텍스트 정보 (경로, 메서드 등)
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   logError(error, { path: '/api/users', method: 'POST' });
 *   return createErrorResponse(error);
 * }
 * ```
 */
export function logError(
  error: unknown,
  context?: ErrorLogContext
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    name: 'UnknownError',
    message: 'Unknown error occurred',
  };

  if (error instanceof AppError) {
    entry.name = error.name;
    entry.message = error.message;
    entry.code = error.code;
    entry.statusCode = error.statusCode;
    entry.stack = error.stack;
    // 4xx 에러는 클라이언트 오류이므로 warn 레벨
    if (error.statusCode >= 400 && error.statusCode < 500) {
      entry.level = 'warn';
    }
  } else if (error instanceof Error) {
    entry.name = error.name;
    entry.message = error.message;
    entry.stack = error.stack;
  } else if (typeof error === 'string') {
    entry.message = error;
  }

  if (context) {
    entry.context = context;
  }

  // JSON 형식으로 로깅 (향후 로그 집계 도구와 호환)
  const logString = JSON.stringify(entry);

  if (entry.level === 'error') {
    console.error(logString);
  } else {
    console.warn(logString);
  }
}

/**
 * Request 객체에서 로깅 컨텍스트 추출
 *
 * @param request - Next.js Request 객체
 * @returns 로깅용 컨텍스트
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     // ...
 *   } catch (error) {
 *     logError(error, extractRequestContext(request));
 *     return createErrorResponse(error);
 *   }
 * }
 * ```
 */
export function extractRequestContext(request: Request): ErrorLogContext {
  const url = new URL(request.url);
  return {
    path: url.pathname,
    method: request.method,
    // 추후 requestId 미들웨어 추가 시 확장 가능
  };
}

/**
 * 경고 레벨 로깅
 *
 * 에러는 아니지만 주의가 필요한 상황에 사용
 */
export function logWarning(
  message: string,
  context?: ErrorLogContext
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    name: 'Warning',
    message,
    context,
  };

  console.warn(JSON.stringify(entry));
}
