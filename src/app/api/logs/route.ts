/**
 * Logs API Route
 * GET /api/logs - 로그 목록 조회 (VIEWER 이상)
 *
 * Phase 37: Log Viewer UI
 * - 로그 목록 필터링/페이지네이션 조회
 * - logStorage.query() 호출
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import { logStorage } from '@/lib/log-storage'
import { LogQuerySchema } from '@/types/log'
import type { LogSource, LogLevel } from '@/types/log'
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
 * GET /api/logs
 * 로그 목록 조회 (VIEWER 이상 권한 필요)
 *
 * Query Parameters:
 * - sources: 소스 필터 (콤마 구분: docker,app,journal)
 * - levels: 레벨 필터 (콤마 구분: info,warn,error)
 * - sourceId: 특정 소스 ID 필터
 * - search: 메시지 검색어
 * - startTime: 시작 시간 (ISO 8601)
 * - endTime: 종료 시간 (ISO 8601)
 * - limit: 조회 개수 (기본값: 100, 최대: 1000)
 * - offset: 오프셋 (기본값: 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
        { success: false, error: '로그 조회 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)

    // sources, levels는 콤마 구분 문자열 → 배열 변환
    const sourcesParam = searchParams.get('sources')
    const levelsParam = searchParams.get('levels')

    // 소스 배열 파싱 및 검증
    let sources: string[] | undefined
    if (sourcesParam) {
      const sourceValues = sourcesParam.split(',').map((s) => s.trim())
      const validSources = ['docker', 'journal', 'app']
      const invalidSources = sourceValues.filter((s) => !validSources.includes(s))
      if (invalidSources.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `유효하지 않은 소스: ${invalidSources.join(', ')}`,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        )
      }
      sources = sourceValues as LogSource[]
    }

    // 레벨 배열 파싱 및 검증
    let levels: string[] | undefined
    if (levelsParam) {
      const levelValues = levelsParam.split(',').map((l) => l.trim())
      const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
      const invalidLevels = levelValues.filter((l) => !validLevels.includes(l))
      if (invalidLevels.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `유효하지 않은 레벨: ${invalidLevels.join(', ')}`,
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        )
      }
      levels = levelValues as LogLevel[]
    }

    // 날짜 파싱
    const startTimeParam = searchParams.get('startTime')
    const endTimeParam = searchParams.get('endTime')
    let startTime: Date | undefined
    let endTime: Date | undefined

    if (startTimeParam) {
      const parsed = new Date(startTimeParam)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 시작 시간 형식입니다', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      startTime = parsed
    }

    if (endTimeParam) {
      const parsed = new Date(endTimeParam)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 종료 시간 형식입니다', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      endTime = parsed
    }

    // 숫자 파라미터
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const queryInput = {
      sources,
      levels,
      sourceId: searchParams.get('sourceId') || undefined,
      search: searchParams.get('search') || undefined,
      startTime,
      endTime,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
      offset: offsetParam ? parseInt(offsetParam, 10) : undefined,
    }

    // 4. 쿼리 파라미터 검증
    const parseResult = LogQuerySchema.safeParse(queryInput)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 쿼리 파라미터입니다',
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 5. 로그 조회
    const result = await logStorage.query(parseResult.data)

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('[Logs] 로그 목록 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '로그 목록 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
