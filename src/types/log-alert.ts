/**
 * Log Alert 타입 정의 (Zod)
 * 로그 패턴 기반 알림 규칙에 사용되는 타입과 스키마를 정의합니다.
 *
 * Phase 38: Log-based Alerts
 * - 키워드 매칭 (keyword)
 * - 정규식 패턴 (pattern)
 * - 빈도 기반 (frequency)
 */
import { z } from 'zod'
import type { AlertSeverity } from './alert'
import { LogLevel, LogSource } from './log'

// ============================================================
// 조건 타입 Enum
// ============================================================

/** 로그 알림 조건 타입 */
export const LogAlertConditionType = z.enum([
  'keyword',   // 키워드 매칭
  'pattern',   // 정규식 패턴
  'frequency', // 빈도 기반 (시간 윈도우 내 발생 횟수)
])

// ============================================================
// 로그 알림 조건 스키마
// ============================================================

/**
 * 로그 알림 조건 스키마
 * 조건 타입에 따라 다른 필드가 사용됩니다.
 */
export const LogAlertConditionSchema = z.object({
  /** 조건 타입 */
  type: LogAlertConditionType,

  // ----------------------------------------
  // keyword/pattern 조건용 필드
  // ----------------------------------------

  /** 매칭할 키워드 목록 (keyword 타입) */
  keywords: z.array(z.string().min(1)).optional(),

  /** 정규식 패턴 (pattern 타입) */
  pattern: z.string().optional(),

  /** 대소문자 구분 여부 (기본: false) */
  caseSensitive: z.boolean().optional().default(false),

  // ----------------------------------------
  // frequency 조건용 필드
  // ----------------------------------------

  /** 발생 횟수 임계값 (frequency 타입) */
  threshold: z.number().int().min(1).optional(),

  /** 시간 윈도우 (분, frequency 타입) */
  windowMinutes: z.number().int().min(1).max(60).optional(),

  /** 타겟 로그 레벨 (frequency 타입, 예: error) */
  level: LogLevel.optional(),
})

// ============================================================
// 로그 알림 규칙 스키마
// ============================================================

/**
 * 로그 알림 규칙 스키마
 */
export const LogAlertRuleSchema = z.object({
  /** 고유 식별자 (UUID) */
  id: z.string().uuid(),

  /** 규칙명 */
  name: z.string().min(1).max(100),

  /** 규칙 설명 (선택) */
  description: z.string().max(500).optional(),

  /** 알림 조건 */
  condition: LogAlertConditionSchema,

  /** 타겟 소스 필터 (비어있으면 모든 소스) */
  sources: z.array(LogSource).optional(),

  /** 타겟 소스 ID 필터 (특정 컨테이너/서비스만) */
  sourceIds: z.array(z.string()).optional(),

  /** 알림 심각도 */
  severity: z.enum(['info', 'warning', 'critical']),

  /** 활성화 여부 */
  enabled: z.boolean().default(true),

  /** 쿨다운 시간 (초) */
  cooldown: z.number().int().min(0).max(86400).default(300),

  /** 소유자 ID (null이면 전역 규칙) */
  userId: z.string().uuid().nullable().optional(),

  /** 생성일 */
  createdAt: z.date(),

  /** 수정일 */
  updatedAt: z.date(),
})

/**
 * 로그 알림 규칙 생성 스키마 (id, createdAt, updatedAt 제외)
 */
export const NewLogAlertRuleSchema = LogAlertRuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

/**
 * 로그 알림 규칙 수정 스키마 (부분 업데이트)
 */
export const UpdateLogAlertRuleSchema = NewLogAlertRuleSchema.partial()

// ============================================================
// 타입 추출
// ============================================================

export type LogAlertConditionType = z.infer<typeof LogAlertConditionType>
export type LogAlertCondition = z.infer<typeof LogAlertConditionSchema>
export type LogAlertRule = z.infer<typeof LogAlertRuleSchema>
export type NewLogAlertRule = z.infer<typeof NewLogAlertRuleSchema>
export type UpdateLogAlertRule = z.infer<typeof UpdateLogAlertRuleSchema>

// ============================================================
// 로그 알림 이벤트 타입 (WebSocket용)
// ============================================================

/**
 * 로그 알림 이벤트 (실시간 알림 발생 시)
 */
export interface LogAlertEvent {
  /** 발생한 알림 */
  alert: {
    ruleId: string
    ruleName: string
    severity: AlertSeverity
    message: string
    value?: number // frequency 조건 시 발생 횟수
  }

  /** 트리거한 로그 (최근 1개) */
  log: {
    id: string
    source: string
    sourceId: string
    level: string
    message: string
    timestamp: Date
  }

  /** 트리거한 규칙 ID */
  ruleId: string

  /** 발생 시간 */
  timestamp: Date
}

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 조건 타입별 요약 문자열 생성
 */
export function formatConditionSummary(condition: LogAlertCondition): string {
  switch (condition.type) {
    case 'keyword':
      if (condition.keywords && condition.keywords.length > 0) {
        const keywords = condition.keywords.slice(0, 3).join(', ')
        const more = condition.keywords.length > 3
          ? ` 외 ${condition.keywords.length - 3}개`
          : ''
        return `키워드: ${keywords}${more}`
      }
      return '키워드 조건'

    case 'pattern':
      if (condition.pattern) {
        const truncated = condition.pattern.length > 30
          ? condition.pattern.slice(0, 30) + '...'
          : condition.pattern
        return `패턴: ${truncated}`
      }
      return '패턴 조건'

    case 'frequency':
      if (condition.threshold && condition.windowMinutes) {
        const levelStr = condition.level ? `${condition.level} ` : ''
        return `${levelStr}로그 ${condition.threshold}회/${condition.windowMinutes}분`
      }
      return '빈도 조건'

    default:
      return '알 수 없는 조건'
  }
}
