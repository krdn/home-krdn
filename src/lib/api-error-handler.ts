/**
 * API 라우트용 중앙집중식 에러 핸들러
 *
 * Phase 27: Error Handling Standardization
 *
 * 모든 API 라우트에서 일관된 에러 응답을 생성합니다.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { logError, extractRequestContext, type ErrorLogContext } from './error-logger';
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
 * API 성공 응답 타입
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 에러를 API 응답으로 변환
 *
 * @param error - 처리할 에러 객체
 * @param defaultMessage - 알 수 없는 에러 시 기본 메시지
 * @returns NextResponse 객체
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     // 비즈니스 로직
 *     throw new ValidationError('이메일 형식이 올바르지 않습니다', 'email');
 *   } catch (error) {
 *     return createErrorResponse(error);
 *   }
 * }
 * ```
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = '서버 오류가 발생했습니다'
): NextResponse<ApiErrorResponse> {
  // AppError 계열 (커스텀 에러)
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false as const,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Zod 검증 에러
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return NextResponse.json(
      {
        success: false as const,
        error: firstIssue.message,
        code: 'VALIDATION_ERROR' as const,
        details: {
          field: firstIssue.path.join('.'),
          issues: error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // JSON 파싱 에러
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false as const,
        error: '잘못된 요청 본문입니다',
        code: 'INVALID_INPUT' as const,
      },
      { status: 400 }
    );
  }

  // 일반 Error
  if (error instanceof Error) {
    // 프로덕션에서는 내부 에러 메시지 숨김 (보안)
    const message =
      process.env.NODE_ENV === 'production' ? defaultMessage : error.message;

    return NextResponse.json(
      {
        success: false as const,
        error: message,
        code: 'INTERNAL_ERROR' as const,
      },
      { status: 500 }
    );
  }

  // 알 수 없는 에러
  return NextResponse.json(
    {
      success: false as const,
      error: defaultMessage,
      code: 'INTERNAL_ERROR' as const,
    },
    { status: 500 }
  );
}

/**
 * API 라우트 핸들러 래퍼
 *
 * try-catch 보일러플레이트를 줄이고 자동으로 에러를 처리합니다.
 *
 * @param handler - 실제 비즈니스 로직 함수
 * @param context - 로깅용 컨텍스트 (선택)
 * @returns NextResponse 객체
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   return withErrorHandler(async () => {
 *     const body = await request.json();
 *     const result = await createUser(body);
 *     return NextResponse.json({ success: true, data: result });
 *   }, extractRequestContext(request));
 * }
 * ```
 */
export async function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: ErrorLogContext
): Promise<NextResponse<T | ApiErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    logError(error, context);
    return createErrorResponse(error);
  }
}

/**
 * 성공 응답 헬퍼
 *
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본: 200)
 * @returns NextResponse 객체
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ user: newUser }, 201);
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
    },
    { status }
  );
}
