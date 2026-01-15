/**
 * Team Members API
 * GET /api/teams/[teamId]/members - 팀 멤버 목록 조회
 * POST /api/teams/[teamId]/members - 멤버 추가
 * DELETE /api/teams/[teamId]/members - 멤버 제거
 *
 * Phase 21: Team Features
 * 멤버만 목록 조회 가능, ADMIN만 멤버 추가/제거 가능
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getTeamById,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  isTeamMember,
  isTeamOwner,
  hasTeamAdminAccess,
  AddMemberInputSchema,
} from '@/lib/team-service'
import { z } from 'zod/v4'

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
 * 멤버 제거 입력 검증 스키마
 */
const RemoveMemberInputSchema = z.object({
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
})

/**
 * GET /api/teams/[teamId]/members
 * 팀 멤버 목록을 조회합니다. (멤버만 접근 가능)
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

    // 4. 멤버 목록 조회
    const members = await getTeamMembers(teamId)

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('[Teams] 멤버 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams/[teamId]/members
 * 팀에 멤버를 추가합니다. (소유자 또는 ADMIN만 가능)
 */
export async function POST(
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

    // 3. 관리 권한 확인
    const hasAccess = await hasTeamAdminAccess(teamId, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: '멤버를 추가할 권한이 없습니다', code: 'FORBIDDEN' },
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
    const parsed = AddMemberInputSchema.safeParse(body)
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

    // 6. 멤버 추가
    const member = await addTeamMember(teamId, parsed.data.userId, parsed.data.role)

    // 7. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    )
  } catch (error) {
    // 이미 멤버인 경우 처리
    if (error instanceof Error && error.message === '이미 팀 멤버입니다') {
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONFLICT' },
        { status: 409 }
      )
    }

    console.error('[Teams] 멤버 추가 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[teamId]/members
 * 팀에서 멤버를 제거합니다. (소유자 또는 ADMIN만 가능, 자기 자신 제거는 일반 멤버도 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
): Promise<NextResponse> {
  try {
    const { teamId } = await params

    // 1. 사용자 인증 확인
    const currentUserId = await getUserIdFromToken(request)
    if (!currentUserId) {
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

    // 3. 요청 body 파싱
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
    const parsed = RemoveMemberInputSchema.safeParse(body)
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

    const targetUserId = parsed.data.userId
    const isSelfRemoval = currentUserId === targetUserId

    // 5. 권한 확인
    // 자기 자신을 제거하는 경우: 멤버이기만 하면 됨
    // 다른 사람을 제거하는 경우: ADMIN 권한 필요
    if (isSelfRemoval) {
      // 소유자는 자기 자신도 제거 불가
      const isOwner = await isTeamOwner(teamId, currentUserId)
      if (isOwner) {
        return NextResponse.json(
          { success: false, error: '팀 소유자는 탈퇴할 수 없습니다. 팀을 삭제하거나 소유권을 이전하세요.', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }

      // 멤버인지 확인
      const isMember = await isTeamMember(teamId, currentUserId)
      if (!isMember) {
        return NextResponse.json(
          { success: false, error: '팀 멤버가 아닙니다', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
    } else {
      // 다른 멤버 제거 시 ADMIN 권한 필요
      const hasAccess = await hasTeamAdminAccess(teamId, currentUserId)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: '멤버를 제거할 권한이 없습니다', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
    }

    // 6. 멤버 제거
    await removeTeamMember(teamId, targetUserId)

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    // 소유자 제거 시도 시 처리
    if (error instanceof Error && error.message === '팀 소유자는 제거할 수 없습니다') {
      return NextResponse.json(
        { success: false, error: error.message, code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    console.error('[Teams] 멤버 제거 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
