/**
 * Port Scan API Route
 * GET /api/ports/scan - 시스템에서 현재 열린 포트 스캔
 *
 * Phase 43: Port Scanner & Guide
 *
 * Response:
 * {
 *   success: true,
 *   system: SystemPort[],    // ss 명령어 결과
 *   docker: DockerPortBinding[],  // Docker API 결과
 *   scannedAt: string       // ISO 날짜
 * }
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { isRoleAtLeast } from '@/lib/rbac'
import { scanSystemPorts, getDockerPortBindings } from '@/lib/port-scanner'
import type { UserRole } from '@/types/auth'
import { logger, Logger } from '@/lib/logger'

// Node.js runtime 필요 (execSync, Docker 소켓 접근)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/ports/scan
 * 시스템에서 현재 열린 포트를 스캔합니다.
 * 인증 필수, VIEWER 이상 역할 필요
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const result = await verifyToken(token)
    if (!result.valid || !result.payload) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증입니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // 2. 권한 확인 (VIEWER 이상)
    if (!isRoleAtLeast(result.payload.role as UserRole, 'viewer')) {
      return NextResponse.json(
        {
          success: false,
          error: '포트 스캔 권한이 없습니다. 필요 역할: viewer 이상',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // 3. 포트 스캔 실행
    const [system, docker] = await Promise.all([
      scanSystemPorts(),
      getDockerPortBindings(),
    ])

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      system,
      docker,
      scannedAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[PortScan] 포트 스캔 오류', Logger.errorToContext(error))
    return NextResponse.json(
      { success: false, error: '포트 스캔에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
