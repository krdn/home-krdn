'use client';

/**
 * useDevOpsSummary 훅
 *
 * DevOps 상태 요약 조회 훅
 * GitHub, Kubernetes, Ports, Log Alerts 상태를 집계하여 반환합니다.
 *
 * Phase 42: DevOps Home
 *
 * @example
 * ```tsx
 * const { summary, isLoading, errorMessage } = useDevOpsSummary();
 *
 * if (summary) {
 *   console.log('GitHub 연결:', summary.github.connected);
 *   console.log('K8s 클러스터:', summary.kubernetes.clusterCount);
 * }
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import type { DevOpsSummary } from '@/types/devops';

// ============================================================
// API 응답 타입
// ============================================================

interface SummaryResponse {
  success: boolean;
  data?: DevOpsSummary;
  error?: string;
  code?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * DevOps 요약 조회
 */
async function fetchDevOpsSummary(): Promise<SummaryResponse> {
  const response = await fetch('/api/devops/summary', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || 'DevOps 요약 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data };
}

// ============================================================
// Query 훅
// ============================================================

interface UseDevOpsSummaryOptions {
  /** 활성화 여부 */
  enabled?: boolean;
  /** 자동 새로고침 간격 (ms) */
  refreshInterval?: number;
}

/**
 * DevOps 상태 요약을 조회하는 훅
 *
 * @param options - 옵션 (enabled, refreshInterval)
 * @returns summary - DevOpsSummary 객체
 * @returns isLoading - 로딩 중 여부
 * @returns errorMessage - 에러 메시지
 * @returns refetch - 재조회 함수
 */
export function useDevOpsSummary(options: UseDevOpsSummaryOptions = {}) {
  const { enabled = true, refreshInterval } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devops', 'summary'],
    queryFn: fetchDevOpsSummary,
    staleTime: 30 * 1000, // 30초
    enabled,
    retry: false,
    refetchInterval: refreshInterval,
  });

  return {
    summary: data?.success ? data.data : null,
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}
