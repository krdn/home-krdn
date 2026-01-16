/**
 * GitHub Settings API Route
 * GET /api/github - GitHub 설정 조회
 * POST /api/github - GitHub 토큰 등록/업데이트
 * DELETE /api/github - GitHub 연동 해제
 *
 * Phase 34: GitHub Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import {
  getGitHubSettings,
  createGitHubSettings,
  updateGitHubSettings,
  deleteGitHubSettings,
} from '@/lib/github-service'
import { CreateGitHubSettingsSchema } from '@/types/github'
import type { JWTPayload } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'

// Prisma 사용으로 Node.js runtime 필요
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 인증 확인 헬퍼 함수
 * @returns JWT 페이로드 또는 null
 */
async function getAuthPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  const result = await verifyToken(token)
  if (!result.valid) {
    return null
  }

  return result.payload
}

/**
 * GET /api/github
 * 현재 로그인 사용자의 GitHub 설정 조회
 *
 * 응답:
 * - 200: { success: true, data: GitHubSettingsDto | null }
 * - 401: 인증 필요
 * - 500: 서버 에러
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. GitHub 설정 조회
    const settings = await getGitHubSettings(payload.userId)

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: settings, // null일 수 있음 (미설정 상태)
    })
  } catch (error) {
    logger.error('[GitHub] 설정 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: 'GitHub 설정 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/github
 * 새 GitHub 토큰 등록 또는 업데이트
 *
 * Body: { accessToken: string }
 *
 * 응답:
 * - 200/201: { success: true, data: GitHubSettingsDto }
 * - 400: 검증 오류
 * - 401: 인증 필요
 * - 500: 서버 에러
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 요청 본문 파싱
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
    const parseResult = CreateGitHubSettingsSchema.safeParse(body)
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message)
      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(', '),
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

    // 4. 기존 설정 확인
    const existing = await getGitHubSettings(payload.userId)

    // 5. 생성 또는 업데이트
    let settings
    let isNew = false

    if (existing) {
      // 업데이트
      settings = await updateGitHubSettings(payload.userId, parseResult.data)
      logger.info('[GitHub] 토큰 업데이트', { userId: payload.userId })
    } else {
      // 생성
      settings = await createGitHubSettings(payload.userId, parseResult.data)
      isNew = true
      logger.info('[GitHub] 토큰 등록', { userId: payload.userId })
    }

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      { status: isNew ? 201 : 200 }
    )
  } catch (error) {
    // 토큰 검증 에러
    if (error instanceof Error && error.message.includes('유효하지 않은')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'INVALID_TOKEN' },
        { status: 400 }
      )
    }

    // rate limit 에러
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'RATE_LIMIT' },
        { status: 429 }
      )
    }

    logger.error('[GitHub] 토큰 등록 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: 'GitHub 토큰 등록에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/github
 * GitHub 연동 해제 (토큰 삭제)
 *
 * 응답:
 * - 200: { success: true }
 * - 401: 인증 필요
 * - 404: 설정 없음
 * - 500: 서버 에러
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. GitHub 설정 삭제
    await deleteGitHubSettings(payload.userId)
    logger.info('[GitHub] 연동 해제', { userId: payload.userId })

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    // 설정 없음 에러
    if (error instanceof Error && error.message.includes('설정이 없습니다')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    logger.error('[GitHub] 연동 해제 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: 'GitHub 연동 해제에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
