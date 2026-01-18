/**
 * Ports Sync API Route
 * POST /api/ports/sync - Services의 포트를 Port Registry에 동기화
 *
 * Services JSON 파일에서 port가 있는 항목들을 자동으로 Port Registry에 등록합니다.
 */

import { NextResponse } from 'next/server'
import { getAllServices } from '@/lib/services'
import { syncAllServicesPorts } from '@/lib/port-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ports/sync
 * Services의 포트를 Port Registry에 동기화합니다.
 */
export async function POST(): Promise<NextResponse> {
  try {
    // 1. 모든 Services 조회
    const services = await getAllServices()

    // 2. Services 포트 동기화
    const result = await syncAllServicesPorts(services)

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      message: `포트 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트, ${result.skipped}개 스킵`,
      result,
    })
  } catch (error) {
    console.error('[Ports Sync] 동기화 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '포트 동기화에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ports/sync
 * 동기화 상태 미리보기 (실제 동기화 없이 어떤 포트가 동기화될지 확인)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const services = await getAllServices()

    // 포트가 있는 서비스만 필터링
    const servicesWithPorts = services
      .filter((s) => s.port)
      .map((s) => ({
        id: s.id,
        name: s.name,
        port: s.port,
        category: s.category,
        status: s.status,
        url: s.url,
      }))

    return NextResponse.json({
      success: true,
      totalServices: services.length,
      servicesWithPorts: servicesWithPorts.length,
      preview: servicesWithPorts,
    })
  } catch (error) {
    console.error('[Ports Sync] 미리보기 오류:', error)
    return NextResponse.json(
      { success: false, error: '미리보기 실패' },
      { status: 500 }
    )
  }
}
