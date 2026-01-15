/**
 * Team Detail API
 * GET /api/teams/[teamId] - 팀 상세 조회
 * PATCH /api/teams/[teamId] - 팀 정보 수정
 * DELETE /api/teams/[teamId] - 팀 삭제
 *
 * Phase 21: Team Features
 * 멤버만 조회 가능, ADMIN만 수정 가능, 소유자만 삭제 가능
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getTeamById,
  updateTeam,
  deleteTeam,
  isTeamMember,
  isTeamOwner,
  hasTeamAdminAccess,
  UpdateTeamInputSchema,
} from '@/lib/team-service'

// better-sqlite3 어댑터 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'

// JWT 설정
const JWT_ALGORITHM = 'HS256'
const COOKIE_NAME = 'auth-token'

/**
 * JWT 시크릿 키를 가져옵니다.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다')
  }
  return new TextEncoder().encode(secret)
}

/**
 * JWT에서 사용자 ID를 추출합니다.
 */
async function getUserIdFromToken(
  request: NextRequest
): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    })

    if (typeof payload.userId === 'string') {
      return payload.userId
    }
    return null
  } catch {
    return null
  }
}

/**
 * GET /api/teams/[teamId]
 * 팀 상세 정보를 조회합니다. (멤버만 접근 가능)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
): Promise<NextResponse> {
  try {
    const { teamId } = await params

    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 팀 존재 여부 확인
    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: '팀을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 3. 멤버 여부 확인
    const isMember = await isTeamMember(teamId, userId)
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: '팀에 접근할 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: team,
    })
  } catch (error) {
    console.error('[Teams] 팀 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/teams/[teamId]
 * 팀 정보를 수정합니다. (소유자 또는 ADMIN 멤버만 가능)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
): Promise<NextResponse> {
  try {
    const { teamId } = await params

    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 팀 존재 여부 확인
    const existingTeam = await getTeamById(teamId)
    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: '팀을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 3. 관리 권한 확인
    const hasAccess = await hasTeamAdminAccess(teamId, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: '팀을 수정할 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. 요청 body 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 5. 입력 검증
    const parsed = UpdateTeamInputSchema.safeParse(body)
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => issue.message)
      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(', '),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 6. 팀 업데이트
    const team = await updateTeam(teamId, parsed.data)

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      data: team,
    })
  } catch (error) {
    console.error('[Teams] 팀 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[teamId]
 * 팀을 삭제합니다. (소유자만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
): Promise<NextResponse> {
  try {
    const { teamId } = await params

    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 팀 존재 여부 확인
    const existingTeam = await getTeamById(teamId)
    if (!existingTeam) {
      return NextResponse.json(
        { success: false, error: '팀을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 3. 소유자 여부 확인
    const isOwner = await isTeamOwner(teamId, userId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: '팀 소유자만 삭제할 수 있습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. 팀 삭제
    await deleteTeam(teamId)

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error('[Teams] 팀 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
