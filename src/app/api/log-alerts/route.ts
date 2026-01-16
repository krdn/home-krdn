/**
 * Log Alerts API Routes
 * 로그 알림 규칙 목록 조회 및 생성
 *
 * Phase 38: Log-based Alerts
 *
 * GET /api/log-alerts - 규칙 목록 조회
 * POST /api/log-alerts - 규칙 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'
import {
  getGlobalLogAlertRules,
  getUserLogAlertRules,
  createLogAlertRule,
  invalidateRulesCache,
} from '@/lib/log-alert-service'
import { NewLogAlertRuleSchema } from '@/types/log-alert'

// Prisma 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 인증 확인 헬퍼 함수
 * @returns JWT 페이로드 또는 null
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
// GET /api/log-alerts
// ============================================================

/**
 * GET /api/log-alerts
 * 로그 알림 규칙 목록 조회 (USER 이상 권한 필요)
 */
export async function GET(): Promise<NextResponse> {
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

    // 3. 전역 규칙 + 사용자 규칙 모두 조회
    const [globalRules, userRules] = await Promise.all([
      getGlobalLogAlertRules(),
      getUserLogAlertRules(payload.userId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        global: globalRules,
        user: userRules,
      },
    })
  } catch (error) {
    logger.error('[LogAlerts] 규칙 목록 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 목록 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/log-alerts
// ============================================================

/**
 * POST /api/log-alerts
 * 로그 알림 규칙 생성 (USER: 개인 규칙, ADMIN: 전역 규칙)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
        { success: false, error: '로그 알림 규칙 생성 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 요청 본문 파싱
    const body = await request.json()

    // 4. 요청 검증
    const parseResult = NewLogAlertRuleSchema.safeParse(body)
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

    const data = parseResult.data

    // 5. 전역 규칙 생성은 Admin만 가능
    const isGlobal = body.global === true
    if (isGlobal && !isRoleAtLeast(payload.role as UserRole, 'admin')) {
      return NextResponse.json(
        { success: false, error: '전역 규칙은 관리자만 생성할 수 있습니다.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 6. 규칙 생성
    const rule = await createLogAlertRule(data, isGlobal ? undefined : payload.userId)

    // 7. 캐시 무효화
    invalidateRulesCache()

    return NextResponse.json(
      { success: true, data: rule },
      { status: 201 }
    )
  } catch (error) {
    logger.error('[LogAlerts] 규칙 생성 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '규칙 생성에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
