/**
 * 에러 로깅 유틸리티
 *
 * Phase 27: Error Handling Standardization
 * Phase 31: pino 기반 구조화된 로깅으로 마이그레이션
 *
 * 에러 전용 로깅 헬퍼를 제공합니다.
 * 내부적으로 중앙 Logger 서비스를 사용합니다.
 */

import { AppError } from './errors';
import { logger, Logger, LogContext } from './logger';

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
  const logContext: LogContext = { ...context };

  if (error instanceof AppError) {
    logContext.code = error.code;
    logContext.statusCode = error.statusCode;
    logContext.stack = error.stack;

    // 4xx 에러는 클라이언트 오류이므로 warn 레벨
    if (error.statusCode >= 400 && error.statusCode < 500) {
      logger.warn(`[${error.name}] ${error.message}`, logContext);
    } else {
      logger.error(`[${error.name}] ${error.message}`, logContext);
    }
  } else if (error instanceof Error) {
    logContext.stack = error.stack;
    logger.error(`[${error.name}] ${error.message}`, logContext);
  } else if (typeof error === 'string') {
    logger.error(error, logContext);
  } else {
    logger.error('Unknown error occurred', logContext);
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
  logger.warn(message, context);
}

/**
 * 정보 레벨 로깅
 *
 * 일반적인 운영 정보 로깅
 */
export function logInfo(
  message: string,
  context?: ErrorLogContext
): void {
  logger.info(message, context);
}

/**
 * 디버그 레벨 로깅
 *
 * 개발 시 유용한 정보
 */
export function logDebug(
  message: string,
  context?: ErrorLogContext
): void {
  logger.debug(message, context);
}
