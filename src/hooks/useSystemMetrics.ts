'use client';

import { useQuery } from '@tanstack/react-query';
import { POLLING_INTERVALS } from '@/config/constants';

export interface NetworkInterfaceData {
  name: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxFormatted: string;
  txFormatted: string;
}

export interface ProcessData {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

export interface SystemMetricsData {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    loadAvg: string[];
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usage: number;
    totalBytes: number;
    usedBytes: number;
  };
  disk: {
    total: string;
    used: string;
    free: string;
    usage: number;
    path: string;
  };
  network: NetworkInterfaceData[];
  processes: ProcessData[];
  uptime: string;
  uptimeSeconds: number;
  hostname: string;
  platform: string;
}

/**
 * 시스템 메트릭을 가져오는 훅 (React Query 기반)
 *
 * @param refreshInterval 폴링 간격 (ms). 기본값: 5000ms
 * @returns data, loading, error, refetch - 기존 API 호환
 */
export function useSystemMetrics(refreshInterval: number = POLLING_INTERVALS.SYSTEM_METRICS) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async (): Promise<SystemMetricsData> => {
      const res = await fetch('/api/system');
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch metrics');
      }

      return json.data;
    },
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: refreshInterval > 0 ? refreshInterval / 2 : 1000 * 30,
  });

  // 기존 API 형태 유지 (backward compatibility)
  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
