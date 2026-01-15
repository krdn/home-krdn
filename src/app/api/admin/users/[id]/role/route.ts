/**
 * Admin Role Management API
 * PATCH /api/admin/users/[id]/role
 *
 * 관리자 전용 역할 변경 API
 * - ADMIN만 호출 가능 (미들웨어에서 1차 검증)
 * - 자기 자신 역할 변경 불가
 * - 마지막 ADMIN 강등 불가
 *
 * Phase 27: 표준화된 에러 핸들링 적용
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
import { AuthError, NotFoundError, ConflictError, ValidationError } from '@/lib/errors'
import { createErrorResponse } from '@/lib/api-error-handler'
import { logError, extractRequestContext } from '@/lib/error-logger'

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
      throw new AuthError('인증이 필요합니다')
    }

    // 2. 요청자 역할 검사 (ADMIN만 허용)
    // 참고: JWT의 role은 lowercase (admin, user, viewer)
    if (requestor.role !== 'admin') {
      throw new AuthError('관리자 권한이 필요합니다', 'FORBIDDEN')
    }

    // 3. 요청 body 파싱 및 검증
    const body = await request.json()
    const parsed = UpdateRoleInputSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError('유효한 역할(ADMIN, USER, VIEWER)을 입력해주세요', 'role')
    }

    const { role: newRole } = parsed.data as { role: Role }

    // 4. 대상 사용자 ID 추출
    const { id: targetUserId } = await context.params

    // 5. 대상 사용자 존재 확인
    const targetUser = await findUserById(targetUserId)
    if (!targetUser) {
      throw new NotFoundError('사용자', targetUserId)
    }

    // 6. 자기 자신 역할 변경 방지
    if (requestor.userId === targetUserId) {
      throw new AuthError('자신의 역할은 변경할 수 없습니다', 'FORBIDDEN')
    }

    // 7. 마지막 ADMIN 강등 방지
    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await countUsersByRole('ADMIN')
      if (adminCount <= 1) {
        throw new ConflictError('마지막 관리자는 강등할 수 없습니다', 'role')
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
    logError(error, extractRequestContext(request))
    return createErrorResponse(error)
  }
}
