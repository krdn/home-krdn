/**
 * Logs Stats API Route
 * GET /api/logs/stats - 로그 통계 조회 (VIEWER 이상)
 *
 * Phase 37: Log Viewer UI
 * - 소스별/레벨별 로그 통계
 * - logStorage.getStats() 호출
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import { logStorage } from '@/lib/log-storage'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'

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

/**
 * VIEWER 이상 역할 필요 (조회용)
 */
function requireViewer(role: UserRole): boolean {
  return isRoleAtLeast(role, 'viewer')
}

/**
 * GET /api/logs/stats
 * 로그 통계 조회 (VIEWER 이상 권한 필요)
 *
 * Response:
 * - bySource: 소스별 로그 개수
 * - byLevel: 레벨별 로그 개수
 * - total: 전체 로그 개수
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

    // 2. 권한 확인 (VIEWER 이상)
    if (!requireViewer(payload.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: '로그 통계 조회 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 통계 조회
    const stats = await logStorage.getStats()

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('[Logs] 로그 통계 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '로그 통계 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
