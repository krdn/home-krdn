/**
 * 비밀번호 재설정 완료 API
 * POST /api/auth/reset-password
 *
 * 토큰을 검증하고 새 비밀번호를 설정합니다.
 * 토큰은 1회 사용 후 무효화됩니다.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import {
  findValidPasswordResetToken,
  markTokenAsUsed,
  updatePasswordHash,
} from '@/lib/user-service'
import { hashPassword } from '@/lib/auth'

// 요청 검증 스키마
const ResetPasswordSchema = z.object({
  token: z.string().min(1, '토큰이 필요합니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

/**
 * POST /api/auth/reset-password
 * 비밀번호 재설정을 완료합니다.
 */
export async function POST(request: Request) {
  try {
    // 요청 파싱
    const body = await request.json()
    const result = ResetPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || '유효하지 않은 요청입니다',
        },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    // 토큰 검증 (만료, 사용 여부 확인)
    const resetToken = await findValidPasswordResetToken(token)

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            '유효하지 않거나 만료된 토큰입니다. 비밀번호 재설정을 다시 요청해주세요.',
        },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(password)

    // 비밀번호 업데이트
    await updatePasswordHash(resetToken.userId, passwordHash)

    // 토큰 사용 처리 (재사용 방지)
    await markTokenAsUsed(resetToken.id)

    console.log(
      `[Reset Password] Password reset successful for user ${resetToken.userId}`
    )

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: '비밀번호 재설정 중 오류가 발생했습니다',
      },
      { status: 500 }
    )
  }
}
