/**
 * Kubernetes Cluster Connection Test API Route
 * POST /api/kubernetes/clusters/[clusterId]/test - 연결 테스트
 *
 * Phase 39: Kubernetes Discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { validateClusterConnection } from '@/lib/kubernetes-service';
import type { JWTPayload } from '@/types/auth';
import { logger, Logger } from '@/lib/logger';

// Prisma 사용으로 Node.js runtime 필요
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 인증 확인 헬퍼 함수
 */
async function getAuthPayload(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const result = await verifyToken(token);
  if (!result.valid) {
    return null;
  }

  return result.payload;
}

interface RouteContext {
  params: Promise<{ clusterId: string }>;
}

/**
 * POST /api/kubernetes/clusters/[clusterId]/test
 * 클러스터 연결 테스트
 *
 * 응답:
 * - 200: { success: true, data: ClusterConnectionResult }
 * - 401: 인증 필요
 * - 404: 클러스터 없음
 * - 500: 서버 에러
 */
export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { clusterId } = await context.params;

    // 1. 인증 확인
    const payload = await getAuthPayload();
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 연결 테스트
    const result = await validateClusterConnection(clusterId, payload.userId);

    logger.info('[Kubernetes] 연결 테스트', {
      userId: payload.userId,
      clusterId,
      success: result.success
    });

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // 클러스터 없음 또는 권한 없음
    if (error instanceof Error && (
      error.message.includes('찾을 수 없습니다') ||
      error.message.includes('권한이 없습니다')
    )) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    logger.error('[Kubernetes] 연결 테스트 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '연결 테스트에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
