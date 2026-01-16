/**
 * Ports [id] API Route
 * GET /api/ports/[id] - 단일 포트 조회 (VIEWER 이상)
 * PATCH /api/ports/[id] - 포트 수정 (ADMIN만)
 * DELETE /api/ports/[id] - 포트 삭제 (ADMIN만)
 *
 * Phase 33: Port Registry System
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import { getPortById, updatePort, deletePort } from '@/lib/port-service'
import { UpdatePortInputSchema } from '@/types/port'
import type { UserRole, JWTPayload } from '@/types/auth'
import { logger } from '@/lib/logger'

// Prisma 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Route params 타입 (Next.js 16 비동기 params)
type Params = Promise<{ id: string }>

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
 * ADMIN 역할 필요 (수정/삭제용)
 */
function requireAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * GET /api/ports/[id]
 * 단일 포트 조회 (VIEWER 이상 권한 필요)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
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

    // 2. 권한 확인 (VIEWER 이상)
    if (!requireViewer(payload.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: '포트 조회 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 파라미터에서 ID 추출 (Next.js 16 비동기)
    const { id } = await params

    // 4. 포트 조회
    const port = await getPortById(id)

    if (!port) {
      return NextResponse.json(
        { success: false, error: '포트를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      port,
    })
  } catch (error) {
    logger.error('[Ports] 포트 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '포트 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ports/[id]
 * 포트 수정 (ADMIN 권한 필요)
 *
 * Body: UpdatePortInput (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
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

    // 2. 권한 확인 (ADMIN만)
    if (!requireAdmin(payload.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: '포트 수정 권한이 없습니다. 필요 역할: admin',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // 3. 파라미터에서 ID 추출
    const { id } = await params

    // 4. 포트 존재 확인
    const existingPort = await getPortById(id)
    if (!existingPort) {
      return NextResponse.json(
        { success: false, error: '포트를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 5. 요청 본문 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 6. 입력 검증
    const parseResult = UpdatePortInputSchema.safeParse(body)
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

    // 7. 포트 업데이트
    const updatedPort = await updatePort(id, parseResult.data)

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      port: updatedPort,
    })
  } catch (error) {
    // 포트 중복 에러 처리
    if (error instanceof Error && error.message.includes('이미 사용 중입니다')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONFLICT' },
        { status: 409 }
      )
    }

    logger.error('[Ports] 포트 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '포트 수정에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ports/[id]
 * 포트 삭제 (ADMIN 권한 필요)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
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

    // 2. 권한 확인 (ADMIN만)
    if (!requireAdmin(payload.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: '포트 삭제 권한이 없습니다. 필요 역할: admin',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // 3. 파라미터에서 ID 추출
    const { id } = await params

    // 4. 포트 존재 확인
    const existingPort = await getPortById(id)
    if (!existingPort) {
      return NextResponse.json(
        { success: false, error: '포트를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 5. 포트 삭제
    await deletePort(id)

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      message: '포트가 삭제되었습니다',
    })
  } catch (error) {
    logger.error('[Ports] 포트 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '포트 삭제에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
