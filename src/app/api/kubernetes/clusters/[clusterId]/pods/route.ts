/**
 * Kubernetes Pods API Route
 * GET /api/kubernetes/clusters/[clusterId]/pods - Pod 목록
 *
 * Phase 39: Kubernetes Discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getPods } from '@/lib/kubernetes-service';
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
 * GET /api/kubernetes/clusters/[clusterId]/pods
 * 클러스터의 Pod 목록 조회
 *
 * Query Params:
 * - namespace: 조회할 네임스페이스 (기본값: 클러스터 기본 NS)
 * - labelSelector: 레이블 셀렉터
 * - limit: 최대 개수
 *
 * 응답:
 * - 200: { success: true, data: K8sPod[] }
 * - 401: 인증 필요
 * - 404: 클러스터 없음
 * - 502: K8s API 에러
 * - 500: 서버 에러
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { clusterId } = await context.params;
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터
    const namespace = searchParams.get('namespace') ?? undefined;
    const labelSelector = searchParams.get('labelSelector') ?? undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;

    // 1. 인증 확인
    const payload = await getAuthPayload();
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Pod 조회
    const pods = await getPods(clusterId, payload.userId, {
      namespace,
      labelSelector,
      limit,
    });

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: pods,
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

    // K8s API 에러
    if (error instanceof Error && (
      error.message.includes('인증') ||
      error.message.includes('권한') ||
      error.message.includes('연결')
    )) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'K8S_API_ERROR' },
        { status: 502 }
      );
    }

    logger.error('[Kubernetes] Pod 조회 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: 'Pod 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
