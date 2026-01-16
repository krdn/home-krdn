/**
 * GitHub Repositories API Route
 * GET /api/github/repos - 레포지토리 목록 조회
 *
 * Phase 34: GitHub Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getRepositories } from '@/lib/github-service'
import { RepositoryFilterSchema } from '@/types/github'
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
 * GET /api/github/repos
 * 현재 사용자의 GitHub 레포지토리 목록 조회
 *
 * Query Parameters:
 * - per_page: 페이지당 항목 수 (기본 30, 최대 100)
 * - page: 페이지 번호 (기본 1)
 * - type: all | owner | public | private | member
 * - sort: created | updated | pushed | full_name
 * - direction: asc | desc
 *
 * 응답:
 * - 200: { success: true, data: GitHubRepo[] }
 * - 401: 인증 필요 또는 토큰 미설정
 * - 429: Rate limit 초과
 * - 502: GitHub API 에러
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload()
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const filterInput = {
      type: searchParams.get('type') || undefined,
      sort: searchParams.get('sort') || undefined,
      direction: searchParams.get('direction') || undefined,
      per_page: searchParams.get('per_page')
        ? parseInt(searchParams.get('per_page')!, 10)
        : undefined,
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page')!, 10)
        : undefined,
    }

    // 3. 필터 검증
    const parseResult = RepositoryFilterSchema.safeParse(filterInput)
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

    // 4. 레포지토리 목록 조회
    const repos = await getRepositories(payload.userId, parseResult.data)

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: repos,
      total: repos.length,
      filters: parseResult.data,
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

    // 토큰 만료
    if (error instanceof Error && error.message.includes('만료되었습니다')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'TOKEN_EXPIRED',
        },
        { status: 401 }
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

    // GitHub 인증 에러
    if (
      error instanceof Error &&
      (error.message.includes('인증에 실패') ||
        error.message.includes('Bad credentials'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub 인증에 실패했습니다. 토큰을 확인해주세요.',
          code: 'GITHUB_AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    // 기타 GitHub API 에러
    logger.error('[GitHub] 레포지토리 목록 조회 오류', Logger.errorToContext(error))
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
