/**
 * Log Alert Service
 * 로그 알림 규칙 서비스 레이어
 *
 * Phase 38: Log-based Alerts
 * - LogAlertRule CRUD 작업
 * - 전역/사용자별 규칙 조회
 * - 규칙 활성화/비활성화
 */

import type { LogAlertRule as PrismaLogAlertRule } from '@prisma/client'
import prisma from '@/lib/prisma'
import type {
  LogAlertRule,
  NewLogAlertRule,
  UpdateLogAlertRule,
  LogAlertCondition,
} from '@/types/log-alert'
import type { LogSource } from '@/types/log'
import type { AlertSeverity } from '@/types/alert'

// ============================================================
// 타입 변환 헬퍼
// ============================================================

/**
 * Prisma LogAlertRule을 API LogAlertRule로 변환
 */
function toLogAlertRule(rule: PrismaLogAlertRule): LogAlertRule {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? undefined,
    condition: JSON.parse(rule.condition) as LogAlertCondition,
    sources: rule.sources ? (JSON.parse(rule.sources) as LogSource[]) : undefined,
    sourceIds: rule.sourceIds ? (JSON.parse(rule.sourceIds) as string[]) : undefined,
    severity: rule.severity as AlertSeverity,
    enabled: rule.enabled,
    cooldown: rule.cooldown,
    userId: rule.userId,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

/**
 * NewLogAlertRule을 Prisma create data로 변환
 */
function toCreateData(data: NewLogAlertRule, userId?: string): {
  name: string
  description: string | null
  condition: string
  sources: string | null
  sourceIds: string | null
  severity: string
  enabled: boolean
  cooldown: number
  userId: string | null
} {
  return {
    name: data.name,
    description: data.description ?? null,
    condition: JSON.stringify(data.condition),
    sources: data.sources ? JSON.stringify(data.sources) : null,
    sourceIds: data.sourceIds ? JSON.stringify(data.sourceIds) : null,
    severity: data.severity,
    enabled: data.enabled ?? true,
    cooldown: data.cooldown ?? 300,
    userId: userId ?? null,
  }
}

// ============================================================
// CRUD 함수
// ============================================================

/**
 * 전역 로그 알림 규칙 조회 (userId가 null인 규칙)
 */
export async function getGlobalLogAlertRules(): Promise<LogAlertRule[]> {
  const rules = await prisma.logAlertRule.findMany({
    where: { userId: null },
    orderBy: { createdAt: 'desc' },
  })
  return rules.map(toLogAlertRule)
}

/**
 * 사용자별 로그 알림 규칙 조회
 */
export async function getUserLogAlertRules(userId: string): Promise<LogAlertRule[]> {
  const rules = await prisma.logAlertRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return rules.map(toLogAlertRule)
}

/**
 * 활성화된 규칙 조회 (전역 + 사용자별)
 * 로그 평가 시 사용
 */
export async function getActiveLogAlertRules(userId?: string): Promise<LogAlertRule[]> {
  const rules = await prisma.logAlertRule.findMany({
    where: {
      enabled: true,
      OR: [
        { userId: null }, // 전역 규칙
        ...(userId ? [{ userId }] : []), // 사용자 규칙 (있으면)
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  return rules.map(toLogAlertRule)
}

/**
 * 모든 활성화된 규칙 조회 (캐싱용)
 */
export async function getAllActiveLogAlertRules(): Promise<LogAlertRule[]> {
  const rules = await prisma.logAlertRule.findMany({
    where: { enabled: true },
    orderBy: { createdAt: 'desc' },
  })
  return rules.map(toLogAlertRule)
}

/**
 * 규칙 조회 by ID
 */
export async function getLogAlertRuleById(id: string): Promise<LogAlertRule | null> {
  const rule = await prisma.logAlertRule.findUnique({
    where: { id },
  })
  return rule ? toLogAlertRule(rule) : null
}

/**
 * 로그 알림 규칙 생성
 */
export async function createLogAlertRule(
  data: NewLogAlertRule,
  userId?: string
): Promise<LogAlertRule> {
  const created = await prisma.logAlertRule.create({
    data: toCreateData(data, userId),
  })
  return toLogAlertRule(created)
}

/**
 * 로그 알림 규칙 수정
 */
export async function updateLogAlertRule(
  id: string,
  data: UpdateLogAlertRule
): Promise<LogAlertRule> {
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description ?? null
  if (data.condition !== undefined) updateData.condition = JSON.stringify(data.condition)
  if (data.sources !== undefined) updateData.sources = data.sources ? JSON.stringify(data.sources) : null
  if (data.sourceIds !== undefined) updateData.sourceIds = data.sourceIds ? JSON.stringify(data.sourceIds) : null
  if (data.severity !== undefined) updateData.severity = data.severity
  if (data.enabled !== undefined) updateData.enabled = data.enabled
  if (data.cooldown !== undefined) updateData.cooldown = data.cooldown

  const updated = await prisma.logAlertRule.update({
    where: { id },
    data: updateData,
  })
  return toLogAlertRule(updated)
}

/**
 * 로그 알림 규칙 삭제
 */
export async function deleteLogAlertRule(id: string): Promise<void> {
  await prisma.logAlertRule.delete({
    where: { id },
  })
}

/**
 * 규칙 활성화/비활성화 토글
 */
export async function toggleLogAlertRule(id: string): Promise<LogAlertRule> {
  // 현재 상태 조회
  const current = await prisma.logAlertRule.findUnique({
    where: { id },
    select: { enabled: true },
  })

  if (!current) {
    throw new Error(`LogAlertRule not found: ${id}`)
  }

  // 토글
  const updated = await prisma.logAlertRule.update({
    where: { id },
    data: { enabled: !current.enabled },
  })

  return toLogAlertRule(updated)
}

// ============================================================
// 규칙 캐싱 (성능 최적화)
// ============================================================

/**
 * 규칙 캐시
 * 로그 평가 시 매번 DB 조회하지 않도록 캐싱
 */
let rulesCache: LogAlertRule[] | null = null
let cacheExpiry: number = 0
const CACHE_TTL_MS = 60 * 1000 // 1분

/**
 * 캐시된 활성 규칙 조회
 * 캐시가 없거나 만료되면 DB에서 조회
 */
export async function getCachedActiveRules(): Promise<LogAlertRule[]> {
  const now = Date.now()

  if (rulesCache && now < cacheExpiry) {
    return rulesCache
  }

  // 캐시 갱신
  rulesCache = await getAllActiveLogAlertRules()
  cacheExpiry = now + CACHE_TTL_MS

  return rulesCache
}

/**
 * 규칙 캐시 무효화
 * 규칙 생성/수정/삭제 시 호출
 */
export function invalidateRulesCache(): void {
  rulesCache = null
  cacheExpiry = 0
}
