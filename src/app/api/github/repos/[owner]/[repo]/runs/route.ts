/**
 * GitHub All Workflow Runs API Route
 * GET /api/github/repos/[owner]/[repo]/runs - 모든 워크플로우 실행 기록 조회
 *
 * Phase 34: GitHub Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getWorkflowRuns } from '@/lib/github-service'
import { WorkflowRunFilterSchema } from '@/types/github'
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
 * GET /api/github/repos/[owner]/[repo]/runs
 * 레포지토리의 모든 워크플로우 실행 기록 조회 (workflowId 없이)
 *
 * Query Parameters:
 * - per_page: 페이지당 항목 수 (기본 10, 최대 100)
 * - page: 페이지 번호 (기본 1)
 * - status: queued | in_progress | completed | ...
 * - actor: 실행자 필터
 * - branch: 브랜치 필터
 * - event: 트리거 이벤트 필터
 *
 * 응답:
 * - 200: { success: true, data: GitHubWorkflowRun[] }
 * - 401: 인증 필요 또는 토큰 미설정
 * - 404: 레포지토리 없음
 * - 429: Rate limit 초과
 * - 502: GitHub API 에러
 */
export async function GET(
  request: NextRequest,
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

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const filterInput = {
      actor: searchParams.get('actor') || undefined,
      branch: searchParams.get('branch') || undefined,
      event: searchParams.get('event') || undefined,
      status: searchParams.get('status') || undefined,
      per_page: searchParams.get('per_page')
        ? parseInt(searchParams.get('per_page')!, 10)
        : 10, // 기본값 10
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page')!, 10)
        : undefined,
    }

    // 4. 필터 검증
    const parseResult = WorkflowRunFilterSchema.safeParse(filterInput)
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

    // 5. 모든 워크플로우 실행 기록 조회 (workflowId 미전달)
    const runs = await getWorkflowRuns(
      payload.userId,
      owner,
      repo,
      undefined, // workflowId 없음 - 전체 조회
      parseResult.data
    )

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: runs,
      total: runs.length,
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
    logger.error('[GitHub] 전체 워크플로우 실행 기록 조회 오류', Logger.errorToContext(error))
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
