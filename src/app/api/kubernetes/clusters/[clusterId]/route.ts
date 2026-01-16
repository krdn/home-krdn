/**
 * Kubernetes Cluster Detail API Route
 * GET /api/kubernetes/clusters/[clusterId] - 클러스터 상세 조회
 * PUT /api/kubernetes/clusters/[clusterId] - 클러스터 수정
 * DELETE /api/kubernetes/clusters/[clusterId] - 클러스터 삭제
 *
 * Phase 39: Kubernetes Discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import {
  getCluster,
  updateCluster,
  deleteCluster,
  toggleClusterActive,
} from '@/lib/kubernetes-service';
import { UpdateKubernetesClusterInputSchema } from '@/types/kubernetes';
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
 * GET /api/kubernetes/clusters/[clusterId]
 * 클러스터 상세 조회
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

    // 2. 클러스터 조회 (소유권 검증 포함)
    const cluster = await getCluster(clusterId, payload.userId);

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: cluster,
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

    logger.error('[Kubernetes] 클러스터 조회 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/kubernetes/clusters/[clusterId]
 * 클러스터 정보 수정
 */
export async function PUT(
  request: NextRequest,
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

    // 2. 요청 본문 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: '유효한 JSON이 필요합니다', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // 3. 입력 검증
    const parseResult = UpdateKubernetesClusterInputSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message);
      return NextResponse.json(
        {
          success: false,
          error: errorMessages.join(', '),
          details: parseResult.error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 4. 클러스터 수정
    const cluster = await updateCluster(clusterId, payload.userId, parseResult.data);
    logger.info('[Kubernetes] 클러스터 수정', { userId: payload.userId, clusterId });

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      data: cluster,
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

    // 이름 중복 에러
    if (error instanceof Error && error.message.includes('이미')) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONFLICT' },
        { status: 409 }
      );
    }

    // 연결 실패 에러
    if (error instanceof Error && (
      error.message.includes('연결') ||
      error.message.includes('인증') ||
      error.message.includes('TLS')
    )) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONNECTION_ERROR' },
        { status: 400 }
      );
    }

    logger.error('[Kubernetes] 클러스터 수정 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 수정에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kubernetes/clusters/[clusterId]
 * 클러스터 삭제
 */
export async function DELETE(
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

    // 2. 클러스터 삭제 (소유권 검증 포함)
    await deleteCluster(clusterId, payload.userId);
    logger.info('[Kubernetes] 클러스터 삭제', { userId: payload.userId, clusterId });

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
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

    logger.error('[Kubernetes] 클러스터 삭제 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 삭제에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kubernetes/clusters/[clusterId]
 * 클러스터 활성화/비활성화 토글
 */
export async function PATCH(
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

    // 2. 활성화 토글
    const cluster = await toggleClusterActive(clusterId, payload.userId);
    logger.info('[Kubernetes] 클러스터 활성화 토글', {
      userId: payload.userId,
      clusterId,
      isActive: cluster.isActive
    });

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: cluster,
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

    logger.error('[Kubernetes] 클러스터 토글 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 상태 변경에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
