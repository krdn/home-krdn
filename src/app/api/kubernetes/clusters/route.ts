/**
 * Kubernetes Clusters API Route
 * GET /api/kubernetes/clusters - 클러스터 목록 조회
 * POST /api/kubernetes/clusters - 새 클러스터 추가
 *
 * Phase 39: Kubernetes Discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getClusters, createCluster } from '@/lib/kubernetes-service';
import { CreateKubernetesClusterInputSchema } from '@/types/kubernetes';
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

/**
 * GET /api/kubernetes/clusters
 * 현재 로그인 사용자의 클러스터 목록 조회
 *
 * 응답:
 * - 200: { success: true, data: KubernetesClusterDto[] }
 * - 401: 인증 필요
 * - 500: 서버 에러
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const payload = await getAuthPayload();
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 클러스터 목록 조회
    const clusters = await getClusters(payload.userId);

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    logger.error('[Kubernetes] 클러스터 목록 조회 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 목록 조회에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kubernetes/clusters
 * 새 Kubernetes 클러스터 추가
 *
 * Body: CreateKubernetesClusterInput
 *
 * 응답:
 * - 201: { success: true, data: KubernetesClusterDto }
 * - 400: 검증 오류 또는 연결 실패
 * - 401: 인증 필요
 * - 409: 이름 중복
 * - 500: 서버 에러
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
    const parseResult = CreateKubernetesClusterInputSchema.safeParse(body);
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

    // 4. 인증 정보 확인
    const input = parseResult.data;
    if (input.authType === 'token' && !input.token) {
      return NextResponse.json(
        { success: false, error: 'token 인증 타입은 토큰이 필수입니다', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (input.authType === 'certificate' && (!input.clientCertificate || !input.clientKey)) {
      return NextResponse.json(
        { success: false, error: 'certificate 인증 타입은 인증서와 키가 필수입니다', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 5. 클러스터 생성 (연결 테스트 포함)
    const cluster = await createCluster(payload.userId, input);
    logger.info('[Kubernetes] 클러스터 추가', { userId: payload.userId, clusterName: input.name });

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: cluster,
      },
      { status: 201 }
    );
  } catch (error) {
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

    logger.error('[Kubernetes] 클러스터 추가 오류', Logger.errorToContext(error));
    return NextResponse.json(
      { success: false, error: '클러스터 추가에 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
