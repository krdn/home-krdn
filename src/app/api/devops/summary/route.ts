/**
 * DevOps Summary API
 *
 * GET /api/devops/summary
 *   - 전체 DevOps 도구 상태 요약 조회
 *
 * Phase 42: DevOps Home
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { JWTPayload } from '@/types/auth';
import type { DevOpsSummary } from '@/types/devops';

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
 * GET /api/devops/summary
 * DevOps 전체 상태 요약 조회
 */
export async function GET(): Promise<NextResponse> {
  try {
    const payload = await getAuthPayload();

    if (!payload) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 병렬로 각 도구 상태 조회
    const [
      githubSettings,
      kubernetesClusters,
      portRegistries,
      portCount,
      activePortCount,
      logAlertRules,
    ] = await Promise.all([
      // GitHub 설정
      prisma.gitHubSettings.findUnique({ where: { userId } }),
      // Kubernetes 클러스터
      prisma.kubernetesCluster.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Port Registry (전역 리소스 - userId 필터 없음)
      prisma.portRegistry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Port 전체 개수
      prisma.portRegistry.count(),
      // Port 활성 개수
      prisma.portRegistry.count({ where: { status: 'active' } }),
      // Log Alert Rules
      prisma.logAlertRule.findMany({
        where: { userId },
      }),
    ]);

    // GitHub 요약
    const githubSummary = {
      connected: !!githubSettings?.accessToken,
      username: githubSettings?.username || undefined,
      repoCount: undefined, // API 호출 비용으로 생략
      recentRuns: undefined, // API 호출 비용으로 생략
    };

    // Kubernetes 요약
    const kubernetesSummary = {
      clusterCount: kubernetesClusters.length,
      activeClusterCount: kubernetesClusters.filter((c) => c.isActive).length,
      clusters: kubernetesClusters.map((c) => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        // 리소스 카운트는 별도 API 호출 필요하므로 생략
      })),
    };

    // Ports 요약
    const portsSummary = {
      totalPorts: portCount,
      activePorts: activePortCount,
      recentPorts: portRegistries.map((p) => ({
        id: p.id,
        port: p.port,
        projectName: p.projectName,
        environment: p.environment,
      })),
    };

    // Log Alerts 요약
    const activeRules = logAlertRules.filter((r) => r.enabled);
    const logAlertsSummary = {
      totalRules: logAlertRules.length,
      activeRules: activeRules.length,
      recentTriggers: 0, // TODO: 트리거 이력 테이블 구현 후 연동
    };

    const summary: DevOpsSummary = {
      github: githubSummary,
      kubernetes: kubernetesSummary,
      ports: portsSummary,
      logAlerts: logAlertsSummary,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('DevOps Summary 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'DevOps 요약 조회에 실패했습니다',
        code: 'DEVOPS_SUMMARY_ERROR',
      },
      { status: 500 }
    );
  }
}
