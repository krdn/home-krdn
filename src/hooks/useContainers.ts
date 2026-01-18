'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { POLLING_INTERVALS, DOCKER_CONFIG } from '@/config/constants';

export interface ContainerData {
  id: string;
  name: string;
  image: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  status: string;
  created: string;
  ports: string[];
  project?: string; // docker-compose 프로젝트 이름
}

export interface ContainerSummary {
  total: number;
  running: number;
  stopped: number;
}

interface ContainersResponse {
  containers: ContainerData[];
  summary: ContainerSummary;
}

interface ActionResult {
  success: boolean;
  message: string;
}

interface LogsResult {
  success: boolean;
  logs: string;
  error?: string;
}

/**
 * Docker 컨테이너를 관리하는 훅 (React Query 기반)
 *
 * @param refreshInterval 폴링 간격 (ms). 기본값: 10000ms
 * @returns containers, summary, loading, error, refetch, performAction, getLogs
 */
export function useContainers(refreshInterval: number = POLLING_INTERVALS.CONTAINERS) {
  const queryClient = useQueryClient();

  // 컨테이너 목록 조회
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['containers'],
    queryFn: async (): Promise<ContainersResponse> => {
      const res = await fetch('/api/docker/containers');
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch containers');
      }

      return json.data;
    },
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    staleTime: refreshInterval > 0 ? refreshInterval / 2 : 1000 * 30,
  });

  // 컨테이너 액션 (start/stop/restart) Mutation
  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'start' | 'stop' | 'restart';
    }): Promise<ActionResult> => {
      const res = await fetch(`/api/docker/containers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (json.success) {
        return { success: true, message: json.message };
      } else {
        return { success: false, message: json.error };
      }
    },
    onSuccess: () => {
      // 액션 성공 후 컨테이너 목록 자동 리페치
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['containers'] });
      }, POLLING_INTERVALS.CONTAINER_ACTION_DELAY);
    },
  });

  // 기존 performAction API 유지
  const performAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      return await actionMutation.mutateAsync({ id, action });
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Action failed',
      };
    }
  };

  // 로그 조회 (캐싱 불필요, 직접 호출)
  const getLogs = async (
    id: string,
    tail: number = DOCKER_CONFIG.DEFAULT_LOG_TAIL_LINES
  ): Promise<LogsResult> => {
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
  };

  // 기존 API 형태 유지 (backward compatibility)
  return {
    containers: data?.containers ?? [],
    summary: data?.summary ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
    performAction,
    getLogs,
  };
}
