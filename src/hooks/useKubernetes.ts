'use client';

/**
 * useKubernetes 훅
 *
 * Kubernetes API 통신 훅 모음
 * 클러스터 CRUD, 리소스 조회 기능을 제공합니다.
 *
 * Phase 40: K8s Dashboard
 *
 * @example
 * ```tsx
 * const { clusters, isLoading } = useK8sClusters();
 * const { createCluster } = useK8sClusterMutation();
 *
 * // 클러스터 추가
 * createCluster.mutate({ name: 'prod', server: 'https://...', token: '...' });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  KubernetesClusterDto,
  CreateKubernetesClusterInput,
  UpdateKubernetesClusterInput,
  ClusterConnectionResult,
  K8sNamespace,
  K8sPod,
  K8sService,
  K8sDeployment,
  ResourceFilter,
} from '@/types/kubernetes';

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
 * 클러스터 목록 조회
 */
async function fetchClusters(): Promise<ApiResponse<KubernetesClusterDto[]>> {
  const response = await fetch('/api/kubernetes/clusters', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || '클러스터 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? [] };
}

/**
 * 클러스터 상세 조회
 */
async function fetchCluster(clusterId: string): Promise<ApiResponse<KubernetesClusterDto>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || '클러스터 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data };
}

/**
 * 클러스터 생성
 */
async function createCluster(input: CreateKubernetesClusterInput): Promise<ApiResponse<KubernetesClusterDto>> {
  const response = await fetch('/api/kubernetes/clusters', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '클러스터 추가에 실패했습니다');
  }

  return { success: true, data: data.data };
}

/**
 * 클러스터 수정
 */
async function updateCluster(
  clusterId: string,
  input: UpdateKubernetesClusterInput
): Promise<ApiResponse<KubernetesClusterDto>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '클러스터 수정에 실패했습니다');
  }

  return { success: true, data: data.data };
}

/**
 * 클러스터 삭제
 */
async function deleteCluster(clusterId: string): Promise<ApiResponse<void>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '클러스터 삭제에 실패했습니다');
  }

  return { success: true };
}

/**
 * 클러스터 활성화 토글
 */
async function toggleCluster(clusterId: string): Promise<ApiResponse<KubernetesClusterDto>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '클러스터 상태 변경에 실패했습니다');
  }

  return { success: true, data: data.data };
}

/**
 * 클러스터 연결 테스트
 */
async function testClusterConnection(clusterId: string): Promise<ApiResponse<ClusterConnectionResult>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}/test`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || '연결 테스트 실패', code: data.code };
  }

  return { success: true, data: data.data };
}

/**
 * 네임스페이스 목록 조회
 */
async function fetchNamespaces(clusterId: string): Promise<ApiResponse<K8sNamespace[]>> {
  const response = await fetch(`/api/kubernetes/clusters/${clusterId}/namespaces`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || 'Namespace 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? [] };
}

/**
 * Pod 목록 조회
 */
async function fetchPods(clusterId: string, filter?: ResourceFilter): Promise<ApiResponse<K8sPod[]>> {
  const params = new URLSearchParams();
  if (filter?.namespace) params.set('namespace', filter.namespace);
  if (filter?.labelSelector) params.set('labelSelector', filter.labelSelector);
  if (filter?.limit) params.set('limit', filter.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/api/kubernetes/clusters/${clusterId}/pods?${queryString}`
    : `/api/kubernetes/clusters/${clusterId}/pods`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || 'Pod 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? [] };
}

/**
 * Service 목록 조회
 */
async function fetchServices(clusterId: string, filter?: ResourceFilter): Promise<ApiResponse<K8sService[]>> {
  const params = new URLSearchParams();
  if (filter?.namespace) params.set('namespace', filter.namespace);
  if (filter?.labelSelector) params.set('labelSelector', filter.labelSelector);
  if (filter?.limit) params.set('limit', filter.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/api/kubernetes/clusters/${clusterId}/services?${queryString}`
    : `/api/kubernetes/clusters/${clusterId}/services`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || 'Service 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? [] };
}

/**
 * Deployment 목록 조회
 */
async function fetchDeployments(clusterId: string, filter?: ResourceFilter): Promise<ApiResponse<K8sDeployment[]>> {
  const params = new URLSearchParams();
  if (filter?.namespace) params.set('namespace', filter.namespace);
  if (filter?.labelSelector) params.set('labelSelector', filter.labelSelector);
  if (filter?.limit) params.set('limit', filter.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/api/kubernetes/clusters/${clusterId}/deployments?${queryString}`
    : `/api/kubernetes/clusters/${clusterId}/deployments`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.error || 'Deployment 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, data: data.data ?? [] };
}

// ============================================================
// Query 훅
// ============================================================

/**
 * 클러스터 목록을 조회하는 훅
 */
export function useK8sClusters() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'clusters'],
    queryFn: fetchClusters,
    staleTime: 30 * 1000, // 30초
    retry: false,
  });

  return {
    clusters: data?.success ? data.data ?? [] : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * 클러스터 상세를 조회하는 훅
 */
export function useK8sCluster(clusterId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'clusters', clusterId],
    queryFn: () => fetchCluster(clusterId!),
    staleTime: 30 * 1000,
    enabled: !!clusterId,
    retry: false,
  });

  return {
    cluster: data?.success ? data.data : null,
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * 네임스페이스 목록을 조회하는 훅
 */
export function useK8sNamespaces(clusterId: string | null, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'namespaces', clusterId],
    queryFn: () => fetchNamespaces(clusterId!),
    staleTime: 60 * 1000, // 1분
    enabled: enabled && !!clusterId,
    retry: false,
  });

  return {
    namespaces: data?.success ? data.data ?? [] : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * Pod 목록을 조회하는 훅
 */
export function useK8sPods(
  clusterId: string | null,
  filter?: ResourceFilter,
  options?: { enabled?: boolean; refreshInterval?: number }
) {
  const { enabled = true, refreshInterval } = options ?? {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'pods', clusterId, filter],
    queryFn: () => fetchPods(clusterId!, filter),
    staleTime: 30 * 1000,
    enabled: enabled && !!clusterId,
    retry: false,
    refetchInterval: refreshInterval,
  });

  return {
    pods: data?.success ? data.data ?? [] : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * Service 목록을 조회하는 훅
 */
export function useK8sServices(
  clusterId: string | null,
  filter?: ResourceFilter,
  options?: { enabled?: boolean; refreshInterval?: number }
) {
  const { enabled = true, refreshInterval } = options ?? {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'services', clusterId, filter],
    queryFn: () => fetchServices(clusterId!, filter),
    staleTime: 60 * 1000,
    enabled: enabled && !!clusterId,
    retry: false,
    refetchInterval: refreshInterval,
  });

  return {
    services: data?.success ? data.data ?? [] : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * Deployment 목록을 조회하는 훅
 */
export function useK8sDeployments(
  clusterId: string | null,
  filter?: ResourceFilter,
  options?: { enabled?: boolean; refreshInterval?: number }
) {
  const { enabled = true, refreshInterval } = options ?? {};

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kubernetes', 'deployments', clusterId, filter],
    queryFn: () => fetchDeployments(clusterId!, filter),
    staleTime: 60 * 1000,
    enabled: enabled && !!clusterId,
    retry: false,
    refetchInterval: refreshInterval,
  });

  return {
    deployments: data?.success ? data.data ?? [] : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

// ============================================================
// Mutation 훅
// ============================================================

/**
 * 클러스터 CRUD mutation 훅
 */
export function useK8sClusterMutation() {
  const queryClient = useQueryClient();

  const createClusterMutation = useMutation({
    mutationFn: createCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubernetes', 'clusters'] });
    },
  });

  const updateClusterMutation = useMutation({
    mutationFn: ({ clusterId, input }: { clusterId: string; input: UpdateKubernetesClusterInput }) =>
      updateCluster(clusterId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubernetes', 'clusters'] });
    },
  });

  const deleteClusterMutation = useMutation({
    mutationFn: deleteCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubernetes', 'clusters'] });
    },
  });

  const toggleClusterMutation = useMutation({
    mutationFn: toggleCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubernetes', 'clusters'] });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: testClusterConnection,
  });

  return {
    createCluster: createClusterMutation,
    updateCluster: updateClusterMutation,
    deleteCluster: deleteClusterMutation,
    toggleCluster: toggleClusterMutation,
    testConnection: testConnectionMutation,
  };
}
