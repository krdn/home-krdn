/**
 * Log Alerts Toggle API Route
 * 로그 알림 규칙 활성화/비활성화 토글
 *
 * Phase 38: Log-based Alerts
 *
 * POST /api/log-alerts/[id]/toggle - 규칙 토글
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'
import {
  getLogAlertRuleById,
  toggleLogAlertRule,
  invalidateRulesCache,
} from '@/lib/log-alert-service'

// Prisma 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * 인증 확인 헬퍼 함수
 */
async function getAuthPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  const result = await verifyToken(token)
  if (!result.valid) {
    return null
  }

  return result.payload
}

// ============================================================
// POST /api/log-alerts/[id]/toggle
// ============================================================

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 권한 확인 (USER 이상)
    if (!isRoleAtLeast(payload.role as UserRole, 'user')) {
      return NextResponse.json(
        { success: false, error: '로그 알림 규칙 토글 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 규칙 조회
    const { id } = await context.params
    const rule = await getLogAlertRuleById(id)

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '규칙을 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. 토글 권한 확인: 본인 규칙이거나 Admin
    if (rule.userId && rule.userId !== payload.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '토글 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 5. 전역 규칙 토글은 Admin만 가능
    if (!rule.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '전역 규칙은 관리자만 토글할 수 있습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 6. 토글 실행
    const updated = await toggleLogAlertRule(id)

    // 7. 캐시 무효화
    invalidateRulesCache()

    return NextResponse.json({
      success: true,
      data: updated,
      message: updated.enabled ? '규칙이 활성화되었습니다.' : '규칙이 비활성화되었습니다.',
    })
  } catch (error) {
    logger.error('[LogAlerts] 규칙 토글 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 토글에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
