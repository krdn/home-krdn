/**
 * Teams API
 * GET /api/teams - 현재 사용자의 팀 목록 조회
 * POST /api/teams - 새 팀 생성
 *
 * Phase 21: Team Features
 * 인증된 사용자만 팀을 조회/생성할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getUserTeams,
  createTeam,
  CreateTeamInputSchema,
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
 * GET /api/teams
 * 현재 인증된 사용자가 속한 모든 팀 목록을 조회합니다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 팀 목록 조회
    const teams = await getUserTeams(userId)

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: teams,
    })
  } catch (error) {
    console.error('[Teams] 팀 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams
 * 새 팀을 생성합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 요청 body 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 3. 입력 검증
    const parsed = CreateTeamInputSchema.safeParse(body)
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

    // 4. 팀 생성
    const team = await createTeam(userId, parsed.data)

    // 5. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: team,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Teams] 팀 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
