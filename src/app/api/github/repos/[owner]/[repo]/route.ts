/**
 * GitHub Repository Detail API Route
 * GET /api/github/repos/[owner]/[repo] - 특정 레포지토리 상세 조회
 *
 * Phase 34: GitHub Integration
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getRepository } from '@/lib/github-service'
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
 * Route Params 타입 (Next.js 15+)
 */
type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

/**
 * GET /api/github/repos/[owner]/[repo]
 * 특정 레포지토리 상세 정보 조회
 *
 * 응답:
 * - 200: { success: true, data: GitHubRepo }
 * - 401: 인증 필요 또는 토큰 미설정
 * - 404: 레포지토리 없음
 * - 429: Rate limit 초과
 * - 502: GitHub API 에러
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. Next.js 15+: params는 Promise이므로 await 사용
    const { owner, repo } = await params

    // 3. 레포지토리 상세 조회
    const repository = await getRepository(payload.userId, owner, repo)

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: repository,
    })
  } catch (error) {
    // GitHub 토큰 미설정
    if (
      error instanceof Error &&
      (error.message.includes('설정이 없습니다') ||
        error.message.includes('토큰이 설정되지 않았습니다'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub 토큰이 설정되지 않았습니다. 먼저 토큰을 등록해주세요.',
          code: 'TOKEN_NOT_FOUND',
        },
        { status: 401 }
      )
    }

    // 레포지토리 없음
    if (
      error instanceof Error &&
      error.message.includes('찾을 수 없습니다')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: '레포지토리를 찾을 수 없습니다',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Rate limit 초과
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      )
    }

    // GitHub 인증/권한 에러
    if (
      error instanceof Error &&
      (error.message.includes('인증에 실패') ||
        error.message.includes('권한이 없습니다'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'GITHUB_AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    // 기타 GitHub API 에러
    logger.error('[GitHub] 레포지토리 상세 조회 오류', Logger.errorToContext(error))
    return NextResponse.json(
      {
        success: false,
        error: 'GitHub API 오류가 발생했습니다',
        code: 'GITHUB_API_ERROR',
      },
      { status: 502 }
    )
  }
}
