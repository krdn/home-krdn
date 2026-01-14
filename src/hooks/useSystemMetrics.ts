'use client';

import { useState, useEffect, useCallback } from 'react';
import { POLLING_INTERVALS } from '@/config/constants';

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
  uptime: string;
  uptimeSeconds: number;
  hostname: string;
  platform: string;
}

export function useSystemMetrics(refreshInterval: number = POLLING_INTERVALS.SYSTEM_METRICS) {
  const [data, setData] = useState<SystemMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/system');
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, refreshInterval]);

  return { data, loading, error, refetch: fetchMetrics };
}
