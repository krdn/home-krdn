/**
 * Kubernetes Service Topology API
 *
 * GET /api/kubernetes/clusters/:clusterId/topology
 *   - 서비스 토폴로지 조회
 *   - Query: namespace (optional)
 *
 * Phase 41: Service Mesh Overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getServiceTopology } from '@/lib/kubernetes-service';
import type { JWTPayload } from '@/types/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ clusterId: string }>;
};

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

/**
 * GET /api/kubernetes/clusters/:clusterId/topology
 * 서비스 토폴로지 조회
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const payload = await getAuthPayload();

    if (!payload) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { clusterId } = await context.params;
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace') || undefined;

    const topology = await getServiceTopology(clusterId, payload.userId, namespace);

    return NextResponse.json({
      success: true,
      data: topology,
    });
  } catch (error) {
    console.error('Topology 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Topology 조회에 실패했습니다',
        code: 'TOPOLOGY_ERROR',
      },
      { status: 500 }
    );
  }
}
