'use client';

/**
 * useLogs 훅
 *
 * 로그 조회 관련 React Query 훅 모음
 * 로그 목록 조회, 통계 조회 기능을 제공합니다.
 *
 * Phase 37: Log Viewer UI
 *
 * @example
 * ```tsx
 * const { logs, total, isLoading } = useLogs({ levels: ['error', 'warn'] });
 * const { stats, isLoading: statsLoading } = useLogStats();
 *
 * // 페이지네이션
 * const { logs } = useLogs({ limit: 50, offset: 100 });
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import type { LogQuery, LogQueryResult, LogStats } from '@/types/log';

// ============================================================
// API 응답 타입
// ============================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * 로그 목록을 가져옵니다.
 * @param query 로그 조회 파라미터
 */
async function fetchLogs(query?: Partial<LogQuery>): Promise<ApiResponse<LogQueryResult>> {
  const params = new URLSearchParams();

  if (query?.sources && query.sources.length > 0) {
    params.set('sources', query.sources.join(','));
  }
  if (query?.levels && query.levels.length > 0) {
    params.set('levels', query.levels.join(','));
  }
  if (query?.sourceId) {
    params.set('sourceId', query.sourceId);
  }
  if (query?.search) {
    params.set('search', query.search);
  }
  if (query?.startTime) {
    params.set('startTime', query.startTime.toISOString());
  }
  if (query?.endTime) {
    params.set('endTime', query.endTime.toISOString());
  }
  if (query?.limit !== undefined) {
    params.set('limit', query.limit.toString());
  }
  if (query?.offset !== undefined) {
    params.set('offset', query.offset.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `/api/logs?${queryString}` : '/api/logs';

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    if (response.status === 403) {
      return { success: false, error: '로그 조회 권한이 없습니다', code: 'FORBIDDEN' };
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '로그 목록을 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 로그 통계를 가져옵니다.
 */
async function fetchLogStats(): Promise<ApiResponse<LogStats>> {
  const response = await fetch('/api/logs/stats', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    if (response.status === 403) {
      return { success: false, error: '로그 통계 조회 권한이 없습니다', code: 'FORBIDDEN' };
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '로그 통계를 가져오는데 실패했습니다');
  }

  return response.json();
}

// ============================================================
// Query 훅
// ============================================================

/**
 * useLogs 훅 옵션
 */
export interface UseLogsOptions extends Partial<LogQuery> {
  /** 훅 활성화 여부 (기본값: true) */
  enabled?: boolean;
  /** 자동 갱신 간격 (ms, 기본값: undefined - 자동 갱신 없음) */
  refetchInterval?: number;
}

/**
 * 로그 목록을 조회합니다.
 *
 * @param options 로그 조회 옵션
 * @returns 로그 목록, 전체 개수, 로딩 상태
 *
 * @example
 * ```tsx
 * // 기본 조회
 * const { logs, total, isLoading } = useLogs();
 *
 * // 필터링된 조회
 * const { logs } = useLogs({
 *   sources: ['docker'],
 *   levels: ['error', 'warn'],
 *   limit: 50,
 * });
 *
 * // 자동 갱신 (5초마다)
 * const { logs } = useLogs({ refetchInterval: 5000 });
 * ```
 */
export function useLogs(options: UseLogsOptions = {}) {
  const { enabled = true, refetchInterval, ...query } = options;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['logs', query],
    queryFn: () => fetchLogs(query),
    enabled,
    refetchInterval,
    staleTime: 10 * 1000, // 10초 동안 fresh 상태 유지
  });

  // 빈 로그 결과 기본값
  const emptyResult: LogQueryResult = {
    logs: [],
    total: 0,
    limit: query.limit ?? 100,
    offset: query.offset ?? 0,
  };

  return {
    /** 로그 목록 */
    logs: data?.success && data.data ? data.data.logs : [],
    /** 전체 로그 개수 (페이지네이션용) */
    total: data?.success && data.data ? data.data.total : 0,
    /** 현재 limit 값 */
    limit: data?.success && data.data ? data.data.limit : emptyResult.limit,
    /** 현재 offset 값 */
    offset: data?.success && data.data ? data.data.offset : emptyResult.offset,
    /** 로딩 상태 (첫 로드) */
    isLoading,
    /** 백그라운드 갱신 중 */
    isFetching,
    /** 에러 객체 */
    error: error as Error | null,
    /** 에러 메시지 */
    errorMessage: data?.success === false ? data.error : null,
    /** 수동 갱신 함수 */
    refetch,
  };
}

/**
 * useLogStats 훅 옵션
 */
export interface UseLogStatsOptions {
  /** 훅 활성화 여부 (기본값: true) */
  enabled?: boolean;
  /** 자동 갱신 간격 (ms) */
  refetchInterval?: number;
}

/**
 * 로그 통계를 조회합니다.
 *
 * @param options 옵션
 * @returns 로그 통계, 로딩 상태
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useLogStats();
 *
 * // 통계 사용 예시
 * stats?.bySource.forEach(({ key, count }) => {
 *   console.log(`${key}: ${count}개`);
 * });
 * ```
 */
export function useLogStats(options: UseLogStatsOptions = {}) {
  const { enabled = true, refetchInterval } = options;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['logs', 'stats'],
    queryFn: fetchLogStats,
    enabled,
    refetchInterval,
    staleTime: 30 * 1000, // 30초 동안 fresh 상태 유지 (통계는 자주 갱신 불필요)
  });

  return {
    /** 로그 통계 */
    stats: data?.success && data.data ? data.data : null,
    /** 소스별 통계 */
    bySource: data?.success && data.data ? data.data.bySource : [],
    /** 레벨별 통계 */
    byLevel: data?.success && data.data ? data.data.byLevel : [],
    /** 전체 로그 개수 */
    total: data?.success && data.data ? data.data.total : 0,
    /** 로딩 상태 (첫 로드) */
    isLoading,
    /** 백그라운드 갱신 중 */
    isFetching,
    /** 에러 객체 */
    error: error as Error | null,
    /** 에러 메시지 */
    errorMessage: data?.success === false ? data.error : null,
    /** 수동 갱신 함수 */
    refetch,
  };
}
