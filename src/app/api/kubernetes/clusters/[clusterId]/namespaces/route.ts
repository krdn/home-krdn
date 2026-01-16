/**
 * Kubernetes Namespaces API Route
 * GET /api/kubernetes/clusters/[clusterId]/namespaces - 네임스페이스 목록
 *
 * Phase 39: Kubernetes Discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getNamespaces } from '@/lib/kubernetes-service';
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
 * GET /api/kubernetes/clusters/[clusterId]/namespaces
 * 클러스터의 네임스페이스 목록 조회
 *
 * 응답:
 * - 200: { success: true, data: K8sNamespace[] }
 * - 401: 인증 필요
 * - 404: 클러스터 없음
 * - 500: 서버 에러
 */
export async function GET(
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

    // 2. 네임스페이스 조회
    const namespaces = await getNamespaces(clusterId, payload.userId);

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: namespaces,
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

    logger.error('[Kubernetes] 네임스페이스 조회 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '네임스페이스 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
