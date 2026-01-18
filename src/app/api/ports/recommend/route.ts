/**
 * Ports Recommend API Route
 * GET /api/ports/recommend - 카테고리/환경에 맞는 포트 추천
 *
 * 신규 프로젝트 시작 시 사용 가능한 포트를 추천합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { recommendPort, getPortUsageByCategory } from '@/lib/port-service'
import { PortCategorySchema, PortEnvironmentSchema, PORT_CATEGORY_RANGES } from '@/types/port'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ports/recommend
 * 포트 추천 조회
 *
 * Query Parameters:
 * - category: 카테고리 (ai, web, n8n, system, database, monitoring, other)
 * - environment: 환경 (development, staging, production) - 기본값: development
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category')
    const environmentParam = searchParams.get('environment') || 'development'

    // 카테고리 없이 호출하면 전체 사용 현황 반환
    if (!categoryParam) {
      const usage = await getPortUsageByCategory()
      const ranges = PORT_CATEGORY_RANGES

      return NextResponse.json({
        success: true,
        message: '카테고리를 지정하면 해당 카테고리의 추천 포트를 받을 수 있습니다',
        usage,
        ranges,
      })
    }

    // 카테고리 검증
    const categoryResult = PortCategorySchema.safeParse(categoryParam)
    if (!categoryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 카테고리입니다',
          validCategories: Object.keys(PORT_CATEGORY_RANGES),
        },
        { status: 400 }
      )
    }

    // 환경 검증
    const environmentResult = PortEnvironmentSchema.safeParse(environmentParam)
    if (!environmentResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 환경입니다',
          validEnvironments: ['development', 'staging', 'production'],
        },
        { status: 400 }
      )
    }

    // 포트 추천
    const recommendation = await recommendPort(
      categoryResult.data,
      environmentResult.data
    )

    if (!recommendation) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 범위에 사용 가능한 포트가 없습니다',
          category: categoryResult.data,
          environment: environmentResult.data,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      recommendation,
    })
  } catch (error) {
    console.error('[Ports Recommend] 추천 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '포트 추천에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
