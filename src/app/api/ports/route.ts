/**
 * Ports API Route
 * GET /api/ports - 포트 목록 조회 (VIEWER 이상)
 * POST /api/ports - 새 포트 등록 (ADMIN만)
 *
 * Phase 33: Port Registry System
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import { getAllPorts, createPort } from '@/lib/port-service'
import {
  CreatePortInputSchema,
  PortFilterInputSchema,
} from '@/types/port'
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
 * ADMIN 역할 필요 (생성/수정/삭제용)
 */
function requireAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * GET /api/ports
 * 포트 목록 조회 (공개 - 인증 불필요)
 *
 * Query Parameters:
 * - category: 카테고리 필터
 * - environment: 환경 필터
 * - status: 상태 필터
 * - projectId: 프로젝트 ID 필터
 * - search: 검색어 (projectName, description)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 쿼리 파라미터 파싱 (인증 불필요 - 공개 조회)
    const { searchParams } = new URL(request.url)
    const filterInput = {
      category: searchParams.get('category') || undefined,
      environment: searchParams.get('environment') || undefined,
      status: searchParams.get('status') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      search: searchParams.get('search') || undefined,
    }

    // 2. 필터 검증
    const parseResult = PortFilterInputSchema.safeParse(filterInput)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 필터 옵션입니다',
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 3. 포트 목록 조회
    const ports = await getAllPorts(parseResult.data)

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      ports,
      total: ports.length,
      filters: parseResult.data,
    })
  } catch (error) {
    logger.error('[Ports] 포트 목록 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '포트 목록 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ports
 * 새 포트 등록 (ADMIN 권한 필요)
 *
 * Body: CreatePortInput
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

    // 2. 권한 확인 (ADMIN만)
    if (!requireAdmin(payload.role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: '포트 등록 권한이 없습니다. 필요 역할: admin',
          code: 'FORBIDDEN',
        },
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
    const parseResult = CreatePortInputSchema.safeParse(body)
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

    // 5. 포트 생성
    const port = await createPort(parseResult.data, payload.userId)

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        port,
      },
      { status: 201 }
    )
  } catch (error) {
    // 포트 중복 에러 처리
    if (error instanceof Error && error.message.includes('이미 사용 중입니다')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONFLICT' },
        { status: 409 }
      )
    }

    logger.error('[Ports] 포트 등록 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '포트 등록에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
