/**
 * Invite Token API
 * GET /api/invites/[token] - 초대 정보 조회
 * POST /api/invites/[token] - 초대 수락
 *
 * Phase 21-02: Team Invite System
 * 토큰 기반 초대 조회 및 수락
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  findValidInvite,
  acceptInvite,
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
 * GET /api/invites/[token]
 * 초대 정보를 조회합니다. (인증 불필요 - 링크 미리보기용)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params

    // 1. 유효한 초대 조회
    const invite = await findValidInvite(token)

    if (!invite) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않거나 만료된 초대입니다',
          code: 'INVALID_INVITE',
        },
        { status: 404 }
      )
    }

    // 2. 성공 응답 (토큰 제외한 기본 정보만 반환)
    return NextResponse.json({
      success: true,
      data: {
        teamName: invite.teamName,
        role: invite.role,
        invitedByUsername: invite.invitedByUsername,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error) {
    console.error('[Invites] 초대 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invites/[token]
 * 초대를 수락합니다. (로그인 필요)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params

    // 1. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 초대 수락
    const member = await acceptInvite(token, userId)

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: member,
    })
  } catch (error) {
    console.error('[Invites] 초대 수락 오류:', error)

    // 알려진 에러 처리
    if (error instanceof Error) {
      const knownErrors: Record<string, { code: string; status: number }> = {
        '초대를 찾을 수 없습니다': { code: 'INVALID_INVITE', status: 404 },
        '초대가 만료되었습니다': { code: 'EXPIRED_INVITE', status: 410 },
        '이미 사용된 초대입니다': { code: 'USED_INVITE', status: 410 },
        '이미 팀 멤버입니다': { code: 'ALREADY_MEMBER', status: 400 },
      }

      const errorInfo = knownErrors[error.message]
      if (errorInfo) {
        return NextResponse.json(
          { success: false, error: error.message, code: errorInfo.code },
          { status: errorInfo.status }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
