'use client';

import { useState, useEffect, useCallback } from 'react';
import { POLLING_INTERVALS, DOCKER_CONFIG } from '@/config/constants';

export interface ContainerData {
  id: string;
  name: string;
  image: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  status: string;
  created: string;
  ports: string[];
}

export interface ContainerSummary {
  total: number;
  running: number;
  stopped: number;
}

export function useContainers(refreshInterval: number = POLLING_INTERVALS.CONTAINERS) {
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [summary, setSummary] = useState<ContainerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/docker/containers');
      const json = await res.json();

      if (json.success) {
        setContainers(json.data.containers);
        setSummary(json.data.summary);
        setError(null);
      } else {
        setError(json.error || 'Failed to fetch containers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchContainers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchContainers, refreshInterval]);

  const performAction = useCallback(
    async (id: string, action: 'start' | 'stop' | 'restart') => {
      try {
        const res = await fetch(`/api/docker/containers/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const json = await res.json();

        if (json.success) {
          // 액션 성공 후 컨테이너 목록 새로고침
          setTimeout(fetchContainers, POLLING_INTERVALS.CONTAINER_ACTION_DELAY);
          return { success: true, message: json.message };
        } else {
          return { success: false, message: json.error };
        }
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Action failed',
        };
      }
    },
    [fetchContainers]
  );

  const getLogs = useCallback(async (id: string, tail: number = DOCKER_CONFIG.DEFAULT_LOG_TAIL_LINES) => {
    try {
      const res = await fetch(`/api/docker/containers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logs', tail }),
      });
      const json = await res.json();

      if (json.success) {
        return { success: true, logs: json.data.logs };
      } else {
        return { success: false, logs: '', error: json.error };
      }
    } catch (err) {
      return {
        success: false,
        logs: '',
        error: err instanceof Error ? err.message : 'Failed to get logs',
      };
    }
  }, []);

  return {
    containers,
    summary,
    loading,
    error,
    refetch: fetchContainers,
    performAction,
    getLogs,
  };
}
