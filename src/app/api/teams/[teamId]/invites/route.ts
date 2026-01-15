/**
 * Team Invites API
 * GET /api/teams/[teamId]/invites - 팀 초대 목록 조회
 * POST /api/teams/[teamId]/invites - 새 초대 생성
 * DELETE /api/teams/[teamId]/invites?inviteId=xxx - 초대 취소
 *
 * Phase 21-02: Team Invite System
 * ADMIN 이상만 초대 관리 가능
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { Resend } from 'resend'
import {
  getTeamById,
  hasTeamAdminAccess,
  createTeamInvite,
  getTeamInvites,
  cancelInvite,
  CreateInviteInputSchema,
} from '@/lib/team-service'
import { findUserById } from '@/lib/user-service'

// better-sqlite3 어댑터 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'

// JWT 설정
const JWT_ALGORITHM = 'HS256'
const COOKIE_NAME = 'auth-token'

// Resend 클라이언트 (API 키 없으면 null)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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
 * 초대 이메일을 발송합니다.
 */
async function sendInviteEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
): Promise<boolean> {
  if (!resend) {
    console.log('[Invites] RESEND_API_KEY 미설정 - 이메일 발송 스킵')
    console.log(`[Invites] 초대 링크: /teams/invite/${token}`)
    return false
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/teams/invite/${token}`

    await resend.emails.send({
      from: process.env.ALERT_EMAIL_FROM || 'noreply@resend.dev',
      to: email,
      subject: `[Home-KRDN] ${teamName} 팀에 초대되었습니다`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${teamName} 팀 초대</h1>
          <p>안녕하세요,</p>
          <p><strong>${inviterName}</strong>님이 <strong>${teamName}</strong> 팀에 초대했습니다.</p>
          <p>아래 버튼을 클릭하여 초대를 수락하세요:</p>
          <div style="margin: 24px 0;">
            <a href="${inviteLink}"
               style="background-color: #0070f3; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              초대 수락하기
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            이 초대 링크는 7일 후 만료됩니다.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px;">
            이 이메일은 Home-KRDN 시스템에서 자동으로 발송되었습니다.
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('[Invites] 이메일 발송 실패:', error)
    return false
  }
}

/**
 * GET /api/teams/[teamId]/invites
 * 팀의 활성 초대 목록을 조회합니다. (ADMIN 이상만 가능)
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

    // 3. 관리 권한 확인
    const hasAccess = await hasTeamAdminAccess(teamId, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: '초대 목록을 조회할 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 4. 초대 목록 조회
    const invites = await getTeamInvites(teamId)

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: invites,
    })
  } catch (error) {
    console.error('[Invites] 초대 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams/[teamId]/invites
 * 새 팀 초대를 생성합니다. (ADMIN 이상만 가능)
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
        { success: false, error: '팀 초대를 생성할 권한이 없습니다', code: 'FORBIDDEN' },
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
    const parsed = CreateInviteInputSchema.safeParse(body)
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

    // 6. 초대 생성
    const invite = await createTeamInvite(teamId, userId, parsed.data)

    // 7. 초대 이메일 발송 (비동기, 실패해도 초대는 생성됨)
    const inviter = await findUserById(userId)
    const inviterName = inviter?.displayName || inviter?.username || 'Unknown'
    const emailSent = await sendInviteEmail(
      parsed.data.email,
      team.name,
      inviterName,
      invite.token // 이메일 링크에 사용할 토큰
    )

    // 8. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        ...invite,
        emailSent,
      },
    })
  } catch (error) {
    console.error('[Invites] 초대 생성 오류:', error)

    // 이미 멤버인 경우 등의 알려진 에러 처리
    if (error instanceof Error) {
      if (error.message === '이미 팀 멤버입니다') {
        return NextResponse.json(
          { success: false, error: error.message, code: 'ALREADY_MEMBER' },
          { status: 400 }
        )
      }
      if (error.message === '팀을 찾을 수 없습니다') {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teams/[teamId]/invites?inviteId=xxx
 * 초대를 취소합니다. (ADMIN 이상만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
): Promise<NextResponse> {
  try {
    const { teamId } = await params
    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')

    // 1. inviteId 확인
    if (!inviteId) {
      return NextResponse.json(
        { success: false, error: 'inviteId가 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    // 2. 사용자 인증 확인
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 3. 팀 존재 여부 확인
    const team = await getTeamById(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: '팀을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 4. 관리 권한 확인
    const hasAccess = await hasTeamAdminAccess(teamId, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: '초대를 취소할 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 5. 초대 취소
    await cancelInvite(inviteId)

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error('[Invites] 초대 취소 오류:', error)

    // Prisma 에러 (존재하지 않는 초대)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { success: false, error: '초대를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
