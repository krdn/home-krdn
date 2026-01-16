/**
 * Log Alert Engine
 * 로그 기반 알림 평가 엔진
 *
 * Phase 38: Log-based Alerts
 * - 키워드 매칭 (keyword)
 * - 정규식 패턴 매칭 (pattern)
 * - 빈도 기반 알림 (frequency)
 * - 쿨다운 메커니즘
 */

import type { LogEntry } from '@/types/log'
import type { LogAlertRule, LogAlertCondition, LogAlertEvent } from '@/types/log-alert'
import type { NewAlert, AlertSeverity } from '@/types/alert'

// ============================================================
// 빈도 추적기 (Frequency Tracker)
// ============================================================

/**
 * 시간 윈도우 기반 빈도 추적기
 * 규칙별로 발생 이벤트 타임스탬프를 추적
 */
class FrequencyTracker {
  // Map<ruleId, timestamps[]>
  private events: Map<string, number[]> = new Map()

  /**
   * 이벤트 추가 및 윈도우 내 카운트 반환
   *
   * @param ruleId 규칙 ID
   * @param timestamp 이벤트 발생 시간 (ms)
   * @param windowMinutes 시간 윈도우 (분)
   * @returns 윈도우 내 이벤트 수
   */
  addEvent(ruleId: string, timestamp: number, windowMinutes: number): number {
    const windowMs = windowMinutes * 60 * 1000
    const cutoff = timestamp - windowMs

    // 기존 이벤트 목록 조회
    let timestamps = this.events.get(ruleId) || []

    // 윈도우 외 이벤트 제거
    timestamps = timestamps.filter((t) => t > cutoff)

    // 새 이벤트 추가
    timestamps.push(timestamp)

    // 저장
    this.events.set(ruleId, timestamps)

    return timestamps.length
  }

  /**
   * 윈도우 내 현재 카운트 조회 (이벤트 추가 없이)
   */
  getCount(ruleId: string, windowMinutes: number, now: number = Date.now()): number {
    const windowMs = windowMinutes * 60 * 1000
    const cutoff = now - windowMs

    const timestamps = this.events.get(ruleId) || []
    return timestamps.filter((t) => t > cutoff).length
  }

  /**
   * 오래된 이벤트 정리 (메모리 관리)
   * 주기적으로 호출 권장
   */
  cleanup(maxAgeMinutes: number = 60): void {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000

    for (const [ruleId, timestamps] of this.events.entries()) {
      const filtered = timestamps.filter((t) => t > cutoff)
      if (filtered.length === 0) {
        this.events.delete(ruleId)
      } else {
        this.events.set(ruleId, filtered)
      }
    }
  }

  /**
   * 전체 초기화 (테스트용)
   */
  reset(): void {
    this.events.clear()
  }
}

// 싱글톤 빈도 추적기
const frequencyTracker = new FrequencyTracker()

// ============================================================
// 쿨다운 관리
// ============================================================

/** 마지막 알림 발생 시간 (규칙별) */
const lastAlertTime: Map<string, number> = new Map()

/**
 * 쿨다운 상태 확인
 */
function isInCooldown(ruleId: string, cooldownSeconds: number): boolean {
  const lastTime = lastAlertTime.get(ruleId)
  if (!lastTime) return false

  const cooldownMs = cooldownSeconds * 1000
  return Date.now() - lastTime < cooldownMs
}

/**
 * 쿨다운 시작
 */
function startCooldown(ruleId: string): void {
  lastAlertTime.set(ruleId, Date.now())
}

/**
 * 쿨다운 초기화 (테스트용)
 */
export function resetLogAlertCooldowns(): void {
  lastAlertTime.clear()
}

/**
 * 특정 규칙 쿨다운 초기화
 */
export function resetLogAlertCooldown(ruleId: string): void {
  lastAlertTime.delete(ruleId)
}

// ============================================================
// 조건 매칭 함수
// ============================================================

/**
 * 키워드 매칭
 * keywords 배열 중 하나라도 메시지에 포함되면 true
 */
function matchKeywords(
  message: string,
  keywords: string[],
  caseSensitive: boolean
): boolean {
  const normalizedMessage = caseSensitive ? message : message.toLowerCase()

  return keywords.some((keyword) => {
    const normalizedKeyword = caseSensitive ? keyword : keyword.toLowerCase()
    return normalizedMessage.includes(normalizedKeyword)
  })
}

/**
 * 정규식 패턴 매칭
 */
function matchPattern(
  message: string,
  pattern: string,
  caseSensitive: boolean
): boolean {
  try {
    const flags = caseSensitive ? '' : 'i'
    const regex = new RegExp(pattern, flags)
    return regex.test(message)
  } catch {
    // 유효하지 않은 정규식
    console.warn(`[LogAlertEngine] Invalid regex pattern: ${pattern}`)
    return false
  }
}

/**
 * 소스 필터 확인
 * 규칙에 sources/sourceIds가 지정되어 있으면 매칭 확인
 */
function matchSourceFilter(
  log: LogEntry,
  rule: LogAlertRule
): boolean {
  // sources 필터 확인
  if (rule.sources && rule.sources.length > 0) {
    if (!rule.sources.includes(log.source)) {
      return false
    }
  }

  // sourceIds 필터 확인
  if (rule.sourceIds && rule.sourceIds.length > 0) {
    if (!rule.sourceIds.includes(log.sourceId)) {
      return false
    }
  }

  return true
}

// ============================================================
// 알림 메시지 포맷
// ============================================================

/**
 * 로그 알림 메시지 생성
 */
function formatLogAlertMessage(
  rule: LogAlertRule,
  log: LogEntry,
  frequencyCount?: number
): string {
  const { condition } = rule

  switch (condition.type) {
    case 'keyword':
      return `로그에서 키워드 감지: "${log.message.slice(0, 100)}${log.message.length > 100 ? '...' : ''}"`

    case 'pattern':
      return `로그에서 패턴 매칭: "${log.message.slice(0, 100)}${log.message.length > 100 ? '...' : ''}"`

    case 'frequency':
      return `${condition.level || ''} 로그 빈도 초과: ${frequencyCount}회/${condition.windowMinutes}분 (임계값: ${condition.threshold})`

    default:
      return `로그 알림: ${log.message.slice(0, 100)}`
  }
}

// ============================================================
// 로그 평가 엔진
// ============================================================

/**
 * 단일 로그를 규칙들에 대해 평가
 *
 * @param log 평가할 로그 엔트리
 * @param rules 활성화된 알림 규칙 목록
 * @returns 발생한 알림 목록
 */
export function evaluateLog(
  log: LogEntry,
  rules: LogAlertRule[]
): NewAlert[] {
  const alerts: NewAlert[] = []

  for (const rule of rules) {
    // 비활성화된 규칙 스킵
    if (!rule.enabled) continue

    // 소스 필터 확인
    if (!matchSourceFilter(log, rule)) continue

    // 쿨다운 확인
    if (isInCooldown(rule.id, rule.cooldown)) continue

    const { condition } = rule
    let triggered = false
    let frequencyCount: number | undefined

    switch (condition.type) {
      case 'keyword':
        if (condition.keywords && condition.keywords.length > 0) {
          triggered = matchKeywords(
            log.message,
            condition.keywords,
            condition.caseSensitive ?? false
          )
        }
        break

      case 'pattern':
        if (condition.pattern) {
          triggered = matchPattern(
            log.message,
            condition.pattern,
            condition.caseSensitive ?? false
          )
        }
        break

      case 'frequency':
        // 레벨 필터 확인
        if (condition.level && log.level !== condition.level) {
          continue
        }

        // 빈도 추적
        if (condition.threshold && condition.windowMinutes) {
          frequencyCount = frequencyTracker.addEvent(
            rule.id,
            log.timestamp.getTime(),
            condition.windowMinutes
          )

          // 임계값 도달 시 트리거
          if (frequencyCount >= condition.threshold) {
            triggered = true
          }
        }
        break
    }

    // 트리거 시 알림 생성
    if (triggered) {
      alerts.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: 'log',
        severity: rule.severity as AlertSeverity,
        status: 'active',
        message: formatLogAlertMessage(rule, log, frequencyCount),
        value: frequencyCount ?? 1,
        threshold: condition.threshold ?? 1,
      })

      // 쿨다운 시작
      startCooldown(rule.id)
    }
  }

  return alerts
}

/**
 * 로그 알림 이벤트 생성 (WebSocket 전송용)
 */
export function createLogAlertEvent(
  alert: NewAlert,
  log: LogEntry,
  ruleId: string
): LogAlertEvent {
  return {
    alert: {
      ruleId: alert.ruleId,
      ruleName: alert.ruleName,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
    },
    log: {
      id: log.id,
      source: log.source,
      sourceId: log.sourceId,
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
    },
    ruleId,
    timestamp: new Date(),
  }
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 빈도 추적기 정리 (주기적 호출 권장)
 */
export function cleanupFrequencyTracker(maxAgeMinutes: number = 60): void {
  frequencyTracker.cleanup(maxAgeMinutes)
}

/**
 * 빈도 추적기 초기화 (테스트용)
 */
export function resetFrequencyTracker(): void {
  frequencyTracker.reset()
}

/**
 * 현재 빈도 카운트 조회 (디버깅용)
 */
export function getFrequencyCount(
  ruleId: string,
  windowMinutes: number
): number {
  return frequencyTracker.getCount(ruleId, windowMinutes)
}
