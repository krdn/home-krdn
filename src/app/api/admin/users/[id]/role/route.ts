/**
 * Admin Role Management API
 * PATCH /api/admin/users/[id]/role
 *
 * 관리자 전용 역할 변경 API
 * - ADMIN만 호출 가능 (미들웨어에서 1차 검증)
 * - 자기 자신 역할 변경 불가
 * - 마지막 ADMIN 강등 불가
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { Role } from '@prisma/client'
import {
  findUserById,
  updateUserRole,
  countUsersByRole,
  UpdateRoleInputSchema,
} from '@/lib/user-service'

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
 * JWT에서 페이로드를 추출합니다.
 */
async function getPayloadFromToken(
  request: NextRequest
): Promise<{ userId: string; role: string } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    })

    if (
      typeof payload.userId === 'string' &&
      typeof payload.role === 'string'
    ) {
      return {
        userId: payload.userId,
        role: payload.role,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * PATCH /api/admin/users/[id]/role
 * 사용자 역할 변경
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. 요청자 정보 추출
    const requestor = await getPayloadFromToken(request)
    if (!requestor) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 요청자 역할 검사 (ADMIN만 허용)
    // 참고: JWT의 role은 lowercase (admin, user, viewer)
    if (requestor.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // 3. 요청 body 파싱 및 검증
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      )
    }

    const parsed = UpdateRoleInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요',
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      )
    }

    const { role: newRole } = parsed.data as { role: Role }

    // 4. 대상 사용자 ID 추출
    const { id: targetUserId } = await context.params

    // 5. 대상 사용자 존재 확인
    const targetUser = await findUserById(targetUserId)
    if (!targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 6. 자기 자신 역할 변경 방지
    if (requestor.userId === targetUserId) {
      return NextResponse.json(
        {
          error: '자신의 역할은 변경할 수 없습니다',
          code: 'SELF_ROLE_CHANGE',
        },
        { status: 403 }
      )
    }

    // 7. 마지막 ADMIN 강등 방지
    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await countUsersByRole('ADMIN')
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: '마지막 관리자는 강등할 수 없습니다',
            code: 'LAST_ADMIN',
          },
          { status: 403 }
        )
      }
    }

    // 8. 역할 변경
    const updatedUser = await updateUserRole(targetUserId, newRole)

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    })
  } catch (error) {
    console.error('[ADMIN] 역할 변경 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
