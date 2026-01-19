'use client';

/**
 * usePortScanner 훅
 *
 * 포트 스캔 관련 React Query 훅 모음
 * 시스템 포트 스캔, Docker 포트 바인딩 조회, PortRegistry 비교 기능을 제공합니다.
 *
 * Phase 43: Port Scanner & Guide
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = usePortScan();
 * const { comparison, isLoading: isComparing } = usePortComparison();
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import type {
  SystemPort,
  DockerPortBinding,
  PortComparisonResult,
} from '@/types/port-scanner';

// ============================================================
// API 응답 타입
// ============================================================

/**
 * 포트 스캔 API 응답
 */
export interface PortScanResponse {
  success: boolean;
  system: SystemPort[];
  docker: DockerPortBinding[];
  scannedAt: string;
  error?: string;
}

/**
 * 포트 비교 API 응답
 */
export interface PortCompareResponse {
  success: boolean;
  comparison: PortComparisonResult;
  comparedAt: string;
  error?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * 포트 스캔 결과를 가져옵니다.
 */
async function fetchPortScan(): Promise<PortScanResponse> {
  const response = await fetch('/api/ports/scan', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return {
        success: false,
        system: [],
        docker: [],
        scannedAt: new Date().toISOString(),
        error: '로그인이 필요합니다',
      };
    }
    if (response.status === 403) {
      return {
        success: false,
        system: [],
        docker: [],
        scannedAt: new Date().toISOString(),
        error: '포트 스캔 권한이 없습니다',
      };
    }
    throw new Error('포트 스캔에 실패했습니다');
  }

  return response.json();
}

/**
 * 포트 비교 결과를 가져옵니다.
 */
async function fetchPortComparison(): Promise<PortCompareResponse> {
  const response = await fetch('/api/ports/compare', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return {
        success: false,
        comparison: {
          registeredAndActive: [],
          registeredButInactive: [],
          unregisteredButActive: [],
          summary: {
            totalRegistered: 0,
            activeCount: 0,
            inactiveCount: 0,
            unregisteredCount: 0,
          },
        },
        comparedAt: new Date().toISOString(),
        error: '로그인이 필요합니다',
      };
    }
    if (response.status === 403) {
      return {
        success: false,
        comparison: {
          registeredAndActive: [],
          registeredButInactive: [],
          unregisteredButActive: [],
          summary: {
            totalRegistered: 0,
            activeCount: 0,
            inactiveCount: 0,
            unregisteredCount: 0,
          },
        },
        comparedAt: new Date().toISOString(),
        error: '포트 비교 권한이 없습니다',
      };
    }
    throw new Error('포트 비교에 실패했습니다');
  }

  return response.json();
}

// ============================================================
// Query 훅
// ============================================================

/**
 * 시스템 포트 스캔 결과를 조회합니다.
 *
 * @param options.enabled 자동 조회 여부 (기본: true)
 * @returns 스캔 결과와 React Query 상태
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = usePortScan();
 *
 * // 수동 새로고침
 * <button onClick={() => refetch()}>새로고침</button>
 * ```
 */
export function usePortScan(options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['portScan'],
    queryFn: fetchPortScan,
    staleTime: 10 * 1000, // 10초 (실시간성 중요)
    enabled: options?.enabled !== false,
  });

  return {
    data,
    system: data?.success ? data.system : [],
    docker: data?.success ? data.docker : [],
    scannedAt: data?.scannedAt,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 등록 포트 vs 실제 포트 비교 결과를 조회합니다.
 *
 * @param options.enabled 자동 조회 여부 (기본: true)
 * @returns 비교 결과와 React Query 상태
 *
 * @example
 * ```tsx
 * const { comparison, summary, isLoading } = usePortComparison();
 *
 * // 요약 표시
 * <p>등록: {summary.totalRegistered}, 활성: {summary.activeCount}</p>
 * ```
 */
export function usePortComparison(options?: { enabled?: boolean }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['portComparison'],
    queryFn: fetchPortComparison,
    staleTime: 30 * 1000, // 30초
    enabled: options?.enabled !== false,
  });

  const comparison = data?.success ? data.comparison : null;

  return {
    data,
    comparison,
    summary: comparison?.summary ?? {
      totalRegistered: 0,
      activeCount: 0,
      inactiveCount: 0,
      unregisteredCount: 0,
    },
    registeredAndActive: comparison?.registeredAndActive ?? [],
    registeredButInactive: comparison?.registeredButInactive ?? [],
    unregisteredButActive: comparison?.unregisteredButActive ?? [],
    comparedAt: data?.comparedAt,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
}
