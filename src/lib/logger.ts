/**
 * 중앙집중식 로깅 서비스
 *
 * Phase 31: Logging Infrastructure
 *
 * pino 기반 구조화된 로깅을 제공합니다.
 * - 개발: pretty-print 포맷
 * - 프로덕션: JSON 포맷 (로그 집계 도구 호환)
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('사용자 로그인', { userId: '123' });
 * logger.error('API 오류', { path: '/api/users', error: err.message });
 * ```
 */

import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';

/**
 * 로그 컨텍스트 타입
 */
export interface LogContext {
  // 요청 관련
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;

  // 사용자 관련
  userId?: string;
  username?: string;
  role?: string;

  // 에러 관련
  error?: string;
  code?: string;
  stack?: string;

  // 기타
  [key: string]: unknown;
}

/**
 * 로그 레벨
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 환경별 로거 설정
 */
function getLoggerConfig(): LoggerOptions {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info');

  const baseConfig: LoggerOptions = {
    level: logLevel,
    base: {
      env: process.env.NODE_ENV || 'development',
      service: 'home-krdn',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  // 개발 환경에서는 pretty-print 사용
  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,env,service',
          messageFormat: '{msg}',
        },
      },
    };
  }

  return baseConfig;
}

/**
 * 기본 로거 인스턴스
 */
const baseLogger: PinoLogger = pino(getLoggerConfig());

/**
 * 확장된 로거 클래스
 *
 * pino 로거를 래핑하여 일관된 API와 컨텍스트 관리를 제공합니다.
 */
class Logger {
  private pino: PinoLogger;

  constructor(pinoInstance: PinoLogger) {
    this.pino = pinoInstance;
  }

  /**
   * 자식 로거 생성 (컨텍스트 바인딩)
   */
  child(bindings: LogContext): Logger {
    return new Logger(this.pino.child(bindings));
  }

  /**
   * TRACE 레벨 로그
   * 매우 상세한 디버깅 정보
   */
  trace(msg: string, context?: LogContext): void {
    this.pino.trace(context || {}, msg);
  }

  /**
   * DEBUG 레벨 로그
   * 개발 시 유용한 정보
   */
  debug(msg: string, context?: LogContext): void {
    this.pino.debug(context || {}, msg);
  }

  /**
   * INFO 레벨 로그
   * 일반적인 운영 정보
   */
  info(msg: string, context?: LogContext): void {
    this.pino.info(context || {}, msg);
  }

  /**
   * WARN 레벨 로그
   * 잠재적 문제 상황
   */
  warn(msg: string, context?: LogContext): void {
    this.pino.warn(context || {}, msg);
  }

  /**
   * ERROR 레벨 로그
   * 에러 상황
   */
  error(msg: string, context?: LogContext): void {
    this.pino.error(context || {}, msg);
  }

  /**
   * FATAL 레벨 로그
   * 치명적 에러 (애플리케이션 종료 수준)
   */
  fatal(msg: string, context?: LogContext): void {
    this.pino.fatal(context || {}, msg);
  }

  /**
   * Error 객체를 로깅 컨텍스트로 변환
   */
  static errorToContext(error: unknown): LogContext {
    if (error instanceof Error) {
      return {
        error: error.message,
        code: (error as Error & { code?: string }).code,
        stack: error.stack,
      };
    }
    return { error: String(error) };
  }
}

/**
 * 기본 로거 인스턴스 (싱글톤)
 */
export const logger = new Logger(baseLogger);

/**
 * 요청별 로거 생성
 *
 * @param request - Request 객체
 * @returns 요청 컨텍스트가 바인딩된 로거
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const log = createRequestLogger(request);
 *   log.info('요청 시작');
 *   // ...
 *   log.info('요청 완료', { duration: 150 });
 * }
 * ```
 */
export function createRequestLogger(request: Request): Logger {
  const url = new URL(request.url);
  return logger.child({
    requestId: crypto.randomUUID(),
    path: url.pathname,
    method: request.method,
  });
}

/**
 * 모듈별 로거 생성
 *
 * @param module - 모듈 이름
 * @returns 모듈 컨텍스트가 바인딩된 로거
 *
 * @example
 * ```typescript
 * const log = createModuleLogger('docker');
 * log.info('컨테이너 시작', { containerId: 'abc123' });
 * ```
 */
export function createModuleLogger(module: string): Logger {
  return logger.child({ module });
}

export { Logger };
