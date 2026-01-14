'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * 클라이언트 측 메트릭 스냅샷 타입
 */
export interface MetricsSnapshotData {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  networkRx: number;
  networkTx: number;
}

/**
 * 차트 렌더링용 포맷된 데이터 타입
 */
export interface ChartDataPoint {
  /** ISO 시간 문자열 (HH:mm) */
  time: string;
  /** 전체 timestamp (툴팁용) */
  timestamp: number;
  /** CPU 사용률 */
  cpu: number;
  /** 메모리 사용률 */
  memory: number;
  /** 디스크 사용률 */
  disk: number;
  /** 네트워크 수신 (MB) */
  networkRxMB: number;
  /** 네트워크 송신 (MB) */
  networkTxMB: number;
}

// 히스토리 갱신 간격 (30초)
const HISTORY_REFRESH_INTERVAL = 30 * 1000;

/**
 * 원본 스냅샷 데이터를 차트용 데이터로 변환
 */
function transformToChartData(rawData: MetricsSnapshotData[]): ChartDataPoint[] {
  return rawData.map((snapshot) => ({
    time: new Date(snapshot.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: snapshot.timestamp,
    cpu: snapshot.cpu,
    memory: snapshot.memory,
    disk: snapshot.disk,
    networkRxMB: Math.round((snapshot.networkRx / 1024 / 1024) * 100) / 100,
    networkTxMB: Math.round((snapshot.networkTx / 1024 / 1024) * 100) / 100,
  }));
}

/**
 * 메트릭 히스토리를 가져오고 차트 렌더링용 데이터를 제공하는 훅 (React Query 기반)
 *
 * @param minutes 조회할 시간 범위 (분). 기본값: 60
 * @returns 히스토리 데이터, 로딩 상태, 에러, 재조회 함수
 */
export function useMetricsHistory(minutes: number = 60) {
  const { data, isLoading, error, refetch } = useQuery({
    // minutes를 queryKey에 포함하여 다른 범위 요청 시 캐시 분리
    queryKey: ['metrics-history', minutes],
    queryFn: async (): Promise<{
      raw: MetricsSnapshotData[];
      chart: ChartDataPoint[];
    }> => {
      const res = await fetch(`/api/system/history?minutes=${minutes}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch history');
      }

      const rawData: MetricsSnapshotData[] = json.data;
      const chartData = transformToChartData(rawData);

      return {
        raw: rawData,
        chart: chartData,
      };
    },
    refetchInterval: HISTORY_REFRESH_INTERVAL,
    staleTime: HISTORY_REFRESH_INTERVAL / 2,
  });

  // 기존 API 형태 유지 (backward compatibility)
  return {
    /** 원본 스냅샷 데이터 */
    data: data?.raw ?? [],
    /** 차트 렌더링용 포맷된 데이터 */
    chartData: data?.chart ?? [],
    /** 로딩 상태 */
    loading: isLoading,
    /** 에러 메시지 */
    error: error?.message ?? null,
    /** 수동 재조회 함수 */
    refetch,
  };
}
