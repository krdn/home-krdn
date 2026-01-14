/**
 * 비밀번호 재설정 요청 API
 * POST /api/auth/forgot-password
 *
 * 이메일로 비밀번호 재설정 링크를 발송합니다.
 * 보안을 위해 사용자 존재 여부와 관계없이 동일한 응답을 반환합니다.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { Resend } from 'resend'
import { findUserByEmail, createPasswordResetToken } from '@/lib/user-service'
import { EMAIL_CONFIG } from '@/config/constants'

// Resend 클라이언트
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// 요청 검증 스키마
const ForgotPasswordSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요'),
})

// 애플리케이션 기본 URL
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * 비밀번호 재설정 이메일 HTML 템플릿
 */
function getResetEmailHtml(resetUrl: string, expiresAt: Date): string {
  const expiresIn = Math.round(
    (expiresAt.getTime() - Date.now()) / (1000 * 60)
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Home-KRDN</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">비밀번호 재설정 요청</h2>

    <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        비밀번호 재설정
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      이 링크는 <strong>${expiresIn}분</strong> 후에 만료됩니다.
    </p>

    <p style="color: #6b7280; font-size: 14px;">
      비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
      버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 붙여넣기 하세요:<br>
      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
`
}

/**
 * POST /api/auth/forgot-password
 * 비밀번호 재설정 요청을 처리합니다.
 */
export async function POST(request: Request) {
  try {
    // 요청 파싱
    const body = await request.json()
    const result = ForgotPasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || '유효하지 않은 요청입니다',
        },
        { status: 400 }
      )
    }

    const { email } = result.data

    // 사용자 조회 (존재 여부와 관계없이 동일한 응답 - 타이밍 공격 방지)
    const user = await findUserByEmail(email)

    // 사용자가 존재하는 경우에만 토큰 생성 및 이메일 발송
    if (user) {
      // 토큰 생성
      const { token, expiresAt } = await createPasswordResetToken(user.id)

      // 재설정 URL 생성
      const resetUrl = `${BASE_URL}/reset-password?token=${token}`

      // 이메일 발송
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.ALERT_EMAIL_FROM || 'noreply@resend.dev',
            to: email,
            subject: `${EMAIL_CONFIG.SUBJECT_PREFIX} 비밀번호 재설정 요청`,
            html: getResetEmailHtml(resetUrl, expiresAt),
          })

          console.log(
            `[Forgot Password] Reset email sent to ${email.substring(0, 3)}***`
          )
        } catch (emailError) {
          console.error('[Forgot Password] Email send failed:', emailError)
          // 이메일 발송 실패해도 사용자에게는 동일한 응답
        }
      } else {
        // 개발 환경: 콘솔에 링크 출력
        console.log(`[Forgot Password] Reset URL (dev mode): ${resetUrl}`)
      }
    }

    // 사용자 존재 여부와 관계없이 동일한 응답 (보안)
    return NextResponse.json({
      success: true,
      message:
        '등록된 이메일이라면 비밀번호 재설정 링크가 발송됩니다. 이메일을 확인해주세요.',
    })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: '비밀번호 재설정 요청 처리 중 오류가 발생했습니다',
      },
      { status: 500 }
    )
  }
}
