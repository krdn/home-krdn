/**
 * Ports Check API Route
 * GET /api/ports/check - 포트 충돌 검사 (USER 이상)
 * POST /api/ports/check/range - 범위 내 사용 가능한 포트 찾기 (USER 이상)
 *
 * Phase 33: Port Registry System
 *
 * 이 API는 UI에서 실시간 충돌 검사에 사용됩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import {
  getPortByNumber,
  findAvailablePort,
} from '@/lib/port-service'
import { PortNumberSchema, PORT_RANGE } from '@/types/port'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger } from '@/lib/logger'

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
 * USER 이상 역할 필요
 */
function requireUser(role: UserRole): boolean {
  return isRoleAtLeast(role, 'user')
}

// 포트 검사 쿼리 스키마
const PortCheckQuerySchema = z.object({
  port: z.coerce.number().pipe(PortNumberSchema),
  excludeId: z.string().optional(), // 수정 시 자기 자신 제외용
})

// 범위 검사 Body 스키마
const PortRangeSchema = z.object({
  start: z.coerce
    .number()
    .int()
    .min(PORT_RANGE.MIN)
    .max(PORT_RANGE.MAX),
  end: z.coerce
    .number()
    .int()
    .min(PORT_RANGE.MIN)
    .max(PORT_RANGE.MAX),
}).refine(
  (data) => data.start <= data.end,
  { message: 'start는 end보다 작거나 같아야 합니다' }
)

/**
 * GET /api/ports/check
 * 포트 충돌 검사 (USER 이상 권한 필요)
 *
 * Query Parameters:
 * - port (필수): 검사할 포트 번호
 * - excludeId (선택): 수정 시 자기 자신을 제외할 포트 ID
 *
 * Response:
 * - available: boolean (사용 가능 여부)
 * - conflict?: PortRegistryDto (충돌 포트 정보)
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

    // 2. 권한 확인 (USER 이상)
    if (!requireUser(payload.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: '포트 검사 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const portParam = searchParams.get('port')
    const excludeIdParam = searchParams.get('excludeId')

    if (!portParam) {
      return NextResponse.json(
        { success: false, error: 'port 파라미터가 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 4. 파라미터 검증
    const parseResult = PortCheckQuerySchema.safeParse({
      port: portParam,
      excludeId: excludeIdParam || undefined,
    })

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 포트 번호입니다',
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const { port, excludeId } = parseResult.data

    // 5. 포트 충돌 검사
    const conflictPort = await getPortByNumber(port)

    // 6. 결과 반환
    // excludeId가 있고 충돌 포트의 ID와 같으면 충돌 아님 (자기 자신 수정)
    if (conflictPort) {
      if (excludeId && conflictPort.id === excludeId) {
        return NextResponse.json({
          success: true,
          available: true,
        })
      }

      return NextResponse.json({
        success: true,
        available: false,
        conflict: conflictPort,
      })
    }

    return NextResponse.json({
      success: true,
      available: true,
    })
  } catch (error) {
    logger.error('[Ports] 포트 충돌 검사 오류:', error)
    return NextResponse.json(
      { success: false, error: '포트 충돌 검사에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ports/check
 * 범위 내 사용 가능한 포트 찾기 (USER 이상 권한 필요)
 *
 * Body: { start: number, end: number }
 *
 * Response:
 * - availablePort: number | null (사용 가능한 첫 번째 포트)
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
    if (!requireUser(payload.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: '포트 검사 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 요청 본문 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 4. 입력 검증
    const parseResult = PortRangeSchema.safeParse(body)
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message)
      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(', '),
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    const { start, end } = parseResult.data

    // 5. 사용 가능한 포트 찾기
    const availablePort = await findAvailablePort(start, end)

    // 6. 결과 반환
    return NextResponse.json({
      success: true,
      availablePort,
      range: { start, end },
    })
  } catch (error) {
    logger.error('[Ports] 사용 가능한 포트 검색 오류:', error)
    return NextResponse.json(
      { success: false, error: '사용 가능한 포트 검색에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
