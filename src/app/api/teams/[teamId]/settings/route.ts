/**
 * 팀 설정 API
 *
 * GET  /api/teams/[teamId]/settings - 팀 설정 조회 (멤버만)
 * PATCH /api/teams/[teamId]/settings - 팀 설정 업데이트 (ADMIN만)
 *
 * Phase 21: Team Features
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getTeamSettings,
  updateTeamSettings,
  isTeamMember,
  hasTeamAdminAccess,
  UpdateTeamSettingsInputSchema,
} from '@/lib/team-service'

// better-sqlite3 어댑터 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'

// JWT 설정
const JWT_ALGORITHM = 'HS256'
const COOKIE_NAME = 'auth-token'

type RouteContext = {
  params: Promise<{ teamId: string }>
}

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
 * GET /api/teams/[teamId]/settings
 * 팀 설정을 조회합니다. (팀 멤버만)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { teamId } = await context.params

    // 2. 팀 멤버 확인
    const isMember = await isTeamMember(teamId, userId)
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: '팀 멤버만 설정을 조회할 수 있습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 설정 조회 (없으면 기본값 생성)
    const settings = await getTeamSettings(teamId)

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[TeamSettings] 팀 설정 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/teams/[teamId]/settings
 * 팀 설정을 업데이트합니다. (ADMIN만)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const { teamId } = await context.params

    // 2. ADMIN 권한 확인
    const isAdmin = await hasTeamAdminAccess(teamId, userId)
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: '관리자만 설정을 변경할 수 있습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 요청 본문 파싱 및 검증
    const body = await request.json()
    const validation = UpdateTeamSettingsInputSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || '입력값이 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 4. 설정 업데이트
    const settings = await updateTeamSettings(teamId, validation.data)

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[TeamSettings] 팀 설정 업데이트 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
