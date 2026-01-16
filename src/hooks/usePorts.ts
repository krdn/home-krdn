'use client';

/**
 * usePorts 훅
 *
 * 포트 레지스트리 관련 React Query 훅 모음
 * 포트 CRUD, 충돌 검사 기능을 제공합니다.
 *
 * Phase 33: Port Registry System
 *
 * @example
 * ```tsx
 * const { ports, isLoading } = usePortsQuery();
 * const createPort = useCreatePort();
 *
 * // 포트 생성
 * createPort.mutate({ port: 3000, projectName: 'my-app' });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PortRegistryDto,
  PortFilterOptions,
  CreatePortInput,
  UpdatePortInput,
} from '@/types/port';

// ============================================================
// API 응답 타입
// ============================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface PortsResponse {
  success: boolean;
  ports: PortRegistryDto[];
  total: number;
  filters?: PortFilterOptions;
  error?: string;
}

interface PortResponse {
  success: boolean;
  port?: PortRegistryDto;
  error?: string;
}

interface CheckPortResponse {
  success: boolean;
  available: boolean;
  conflict?: PortRegistryDto;
  error?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * 포트 목록을 가져옵니다.
 * @param filters 필터 옵션
 */
async function fetchPorts(filters?: PortFilterOptions): Promise<PortsResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.set('category', filters.category);
  if (filters?.environment) params.set('environment', filters.environment);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.projectId) params.set('projectId', filters.projectId);
  if (filters?.search) params.set('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/api/ports?${queryString}` : '/api/ports';

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, ports: [], total: 0, error: '로그인이 필요합니다' };
    }
    if (response.status === 403) {
      return { success: false, ports: [], total: 0, error: '포트 조회 권한이 없습니다' };
    }
    throw new Error('포트 목록을 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 단일 포트를 가져옵니다.
 * @param id 포트 ID
 */
async function fetchPort(id: string): Promise<PortResponse> {
  const response = await fetch(`/api/ports/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '포트 정보를 가져오는데 실패했습니다');
  }

  return response.json();
}

/**
 * 포트 충돌 검사
 * @param port 포트 번호
 * @param excludeId 제외할 포트 ID (수정 시)
 */
async function checkPort(port: number, excludeId?: string): Promise<CheckPortResponse> {
  const params = new URLSearchParams();
  params.set('port', port.toString());
  if (excludeId) params.set('excludeId', excludeId);

  const response = await fetch(`/api/ports/check?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '포트 충돌 검사에 실패했습니다');
  }

  return response.json();
}

// ============================================================
// Query 훅
// ============================================================

/**
 * 포트 목록을 조회합니다.
 * @param filters 필터 옵션
 */
export function usePortsQuery(filters?: PortFilterOptions) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ports', filters],
    queryFn: () => fetchPorts(filters),
    staleTime: 30 * 1000, // 30초
  });

  return {
    ports: data?.success ? data.ports : [],
    total: data?.success ? data.total : 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 단일 포트를 조회합니다.
 * @param id 포트 ID
 */
export function usePortQuery(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['port', id],
    queryFn: () => fetchPort(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return {
    port: data?.success ? data.port : null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * 포트 충돌 검사 훅
 * 실시간 검사용 (debounce는 컴포넌트에서 처리)
 */
export function useCheckPort() {
  return useMutation({
    mutationFn: async ({
      port,
      excludeId,
    }: {
      port: number;
      excludeId?: string;
    }): Promise<CheckPortResponse> => {
      return checkPort(port, excludeId);
    },
  });
}

// ============================================================
// Mutation 훅
// ============================================================

/**
 * 포트 생성 mutation
 */
export function useCreatePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePortInput): Promise<ApiResponse<PortRegistryDto>> => {
      const response = await fetch('/api/ports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '포트 등록에 실패했습니다');
      }

      return { success: true, data: data.port };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
    },
  });
}

/**
 * 포트 수정 mutation
 */
export function useUpdatePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePortInput;
    }): Promise<ApiResponse<PortRegistryDto>> => {
      const response = await fetch(`/api/ports/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '포트 수정에 실패했습니다');
      }

      return { success: true, data: result.port };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port', variables.id] });
    },
  });
}

/**
 * 포트 삭제 mutation
 */
export function useDeletePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/ports/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '포트 삭제에 실패했습니다');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
    },
  });
}
