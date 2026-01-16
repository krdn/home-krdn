/**
 * Log Alerts [id] API Routes
 * 개별 로그 알림 규칙 조회, 수정, 삭제
 *
 * Phase 38: Log-based Alerts
 *
 * GET /api/log-alerts/[id] - 규칙 상세 조회
 * PUT /api/log-alerts/[id] - 규칙 수정
 * DELETE /api/log-alerts/[id] - 규칙 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'
import {
  getLogAlertRuleById,
  updateLogAlertRule,
  deleteLogAlertRule,
  invalidateRulesCache,
} from '@/lib/log-alert-service'
import { UpdateLogAlertRuleSchema } from '@/types/log-alert'

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
// GET /api/log-alerts/[id]
// ============================================================

export async function GET(
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
        { success: false, error: '로그 알림 규칙 조회 권한이 없습니다', code: 'FORBIDDEN' },
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

    // 4. 접근 권한 확인: 본인 규칙이거나 전역 규칙만 조회 가능 (Admin은 모두 조회 가능)
    if (rule.userId && rule.userId !== payload.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    logger.error('[LogAlerts] 규칙 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================
// PUT /api/log-alerts/[id]
// ============================================================

export async function PUT(
  request: NextRequest,
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
        { success: false, error: '로그 알림 규칙 수정 권한이 없습니다', code: 'FORBIDDEN' },
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

    // 4. 수정 권한 확인: 본인 규칙이거나 Admin
    if (rule.userId && rule.userId !== payload.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '수정 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 5. 전역 규칙 수정은 Admin만 가능
    if (!rule.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '전역 규칙은 관리자만 수정할 수 있습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 6. 요청 본문 파싱 및 검증
    const body = await request.json()
    const parseResult = UpdateLogAlertRuleSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 요청입니다.',
          details: parseResult.error.flatten(),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 7. 규칙 수정
    const updated = await updateLogAlertRule(id, parseResult.data)

    // 8. 캐시 무효화
    invalidateRulesCache()

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    logger.error('[LogAlerts] 규칙 수정 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 수정에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE /api/log-alerts/[id]
// ============================================================

export async function DELETE(
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
        { success: false, error: '로그 알림 규칙 삭제 권한이 없습니다', code: 'FORBIDDEN' },
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

    // 4. 삭제 권한 확인: 본인 규칙이거나 Admin
    if (rule.userId && rule.userId !== payload.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 5. 전역 규칙 삭제는 Admin만 가능
    if (!rule.userId && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '전역 규칙은 관리자만 삭제할 수 있습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 6. 규칙 삭제
    await deleteLogAlertRule(id)

    // 7. 캐시 무효화
    invalidateRulesCache()

    return NextResponse.json({ success: true, message: '규칙이 삭제되었습니다.' })
  } catch (error) {
    logger.error('[LogAlerts] 규칙 삭제 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 삭제에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
