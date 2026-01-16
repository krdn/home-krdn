/**
 * Log Entry 타입 정의 (Zod)
 * 로그 수집/저장/조회에 사용되는 타입과 스키마를 정의합니다.
 *
 * Phase 36: Log Aggregation
 * - Docker 컨테이너, systemd journal, 애플리케이션 로그 통합
 * - 런타임 검증을 위한 Zod 스키마
 */
import { z } from 'zod';

// ============================================================
// 로그 레벨 및 소스 Enum
// ============================================================

/** 로그 레벨 (trace가 가장 낮음, fatal이 가장 높음) */
export const LogLevel = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

/** 로그 소스 유형 */
export const LogSource = z.enum([
  'docker',   // Docker 컨테이너 로그
  'journal',  // systemd journald 로그
  'app',      // 애플리케이션 로그 (Pino 등)
]);

// ============================================================
// 로그 엔트리 스키마
// ============================================================

/**
 * 로그 엔트리 스키마
 * 모든 소스에서 수집된 로그를 통합하는 표준 형식
 */
export const LogEntrySchema = z.object({
  /** 고유 식별자 (UUID) */
  id: z.string().uuid(),

  /** 로그 소스 유형 */
  source: LogSource,

  /** 소스 식별자 (컨테이너 ID, 유닛명, 파일 경로 등) */
  sourceId: z.string().min(1),

  /** 로그 레벨 */
  level: LogLevel,

  /** 로그 메시지 */
  message: z.string(),

  /** 로그 발생 시간 */
  timestamp: z.date(),

  /** 추가 메타데이터 (선택) */
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 로그 엔트리 입력 스키마 (id, timestamp 자동 생성)
 */
export const LogEntryInputSchema = LogEntrySchema.omit({
  id: true,
}).extend({
  timestamp: z.date().optional(), // 선택적, 없으면 현재 시간 사용
});

// ============================================================
// 로그 조회 파라미터 스키마
// ============================================================

/**
 * 로그 조회 쿼리 스키마
 * 로그 목록 조회 시 필터링/페이지네이션 옵션
 */
export const LogQuerySchema = z.object({
  /** 소스 필터 (여러 소스 선택 가능) */
  sources: z.array(LogSource).optional(),

  /** 레벨 필터 (여러 레벨 선택 가능) */
  levels: z.array(LogLevel).optional(),

  /** 특정 소스 ID 필터 (예: 특정 컨테이너만) */
  sourceId: z.string().optional(),

  /** 메시지 검색어 (LIKE 검색) */
  search: z.string().optional(),

  /** 시작 시간 필터 */
  startTime: z.date().optional(),

  /** 종료 시간 필터 */
  endTime: z.date().optional(),

  /** 조회 개수 제한 (기본값: 100) */
  limit: z.number().int().min(1).max(1000).default(100),

  /** 오프셋 (페이지네이션, 기본값: 0) */
  offset: z.number().int().min(0).default(0),
});

/**
 * API 요청용 로그 조회 스키마 (날짜를 문자열로 수신)
 */
export const LogQueryApiSchema = LogQuerySchema.extend({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
}).transform((data) => ({
  ...data,
  startTime: data.startTime ? new Date(data.startTime) : undefined,
  endTime: data.endTime ? new Date(data.endTime) : undefined,
}));

// ============================================================
// 로그 통계 스키마
// ============================================================

/**
 * 로그 통계 항목 스키마
 */
export const LogStatsItemSchema = z.object({
  /** 그룹 키 (소스명 또는 레벨) */
  key: z.string(),

  /** 로그 수 */
  count: z.number().int().min(0),
});

/**
 * 로그 통계 스키마
 */
export const LogStatsSchema = z.object({
  /** 소스별 통계 */
  bySource: z.array(LogStatsItemSchema),

  /** 레벨별 통계 */
  byLevel: z.array(LogStatsItemSchema),

  /** 전체 로그 수 */
  total: z.number().int().min(0),
});

// ============================================================
// 로그 조회 결과 스키마
// ============================================================

/**
 * 로그 조회 결과 스키마 (페이지네이션 포함)
 */
export const LogQueryResultSchema = z.object({
  /** 로그 목록 */
  logs: z.array(LogEntrySchema),

  /** 전체 매칭 개수 (페이지네이션 계산용) */
  total: z.number().int().min(0),

  /** 현재 limit */
  limit: z.number().int(),

  /** 현재 offset */
  offset: z.number().int(),
});

// ============================================================
// 타입 추출
// ============================================================

export type LogLevel = z.infer<typeof LogLevel>;
export type LogSource = z.infer<typeof LogSource>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogEntryInput = z.infer<typeof LogEntryInputSchema>;
export type LogQuery = z.infer<typeof LogQuerySchema>;
export type LogStatsItem = z.infer<typeof LogStatsItemSchema>;
export type LogStats = z.infer<typeof LogStatsSchema>;
export type LogQueryResult = z.infer<typeof LogQueryResultSchema>;

// ============================================================
// 헬퍼 상수 및 함수
// ============================================================

/**
 * 로그 레벨 우선순위 (숫자가 높을수록 심각)
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

/**
 * 로그 레벨 이상인지 확인
 * @param level 비교 대상 레벨
 * @param minLevel 최소 레벨
 * @returns minLevel 이상이면 true
 */
export function isLogLevelAtLeast(
  level: LogLevel,
  minLevel: LogLevel
): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * 로그 레벨 색상 (UI 표시용)
 */
export const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  trace: 'text-gray-400',
  debug: 'text-gray-500',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
  fatal: 'text-red-700',
};

/**
 * 로그 소스 아이콘 (UI 표시용)
 */
export const LOG_SOURCE_ICONS: Record<LogSource, string> = {
  docker: 'container',
  journal: 'terminal',
  app: 'code',
};
