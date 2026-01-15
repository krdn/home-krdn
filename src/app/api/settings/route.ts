/**
 * User Settings API
 * GET /api/settings - 사용자 설정 조회
 * PUT /api/settings - 사용자 설정 업데이트
 *
 * Phase 20: 사용자 대시보드 설정 관리
 * 인증된 사용자만 자신의 설정을 조회/수정할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  getUserSettings,
  updateUserSettings,
  UpdateSettingsInputSchema,
} from '@/lib/settings-service'

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
 * GET /api/settings
 * 현재 인증된 사용자의 설정을 조회합니다.
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

    // 2. 설정 조회
    const settings = await getUserSettings(userId)

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[Settings] 설정 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * 현재 인증된 사용자의 설정을 업데이트합니다.
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    const parsed = UpdateSettingsInputSchema.safeParse(body)
    if (!parsed.success) {
      // Zod 에러 메시지 추출
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

    // 4. 설정 업데이트
    const settings = await updateUserSettings(userId, parsed.data)

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('[Settings] 설정 업데이트 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
