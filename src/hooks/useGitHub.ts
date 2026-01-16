'use client';

/**
 * useGitHub 훅
 *
 * GitHub API 통신 훅 모음
 * GitHub 설정 CRUD, 레포지토리 목록 조회 기능을 제공합니다.
 *
 * Phase 35: CI/CD Dashboard
 *
 * @example
 * ```tsx
 * const { settings, isLoading } = useGitHubSettings();
 * const { saveSettings } = useGitHubSettingsMutation();
 *
 * // 토큰 등록
 * saveSettings.mutate({ accessToken: 'ghp_...' });
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GitHubSettingsDto,
  GitHubRepo,
  GitHubWorkflow,
  GitHubWorkflowRun,
  RepositoryFilter,
  WorkflowRunFilter,
} from '@/types/github';

// ============================================================
// API 응답 타입
// ============================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

interface SettingsResponse {
  success: boolean;
  settings: GitHubSettingsDto | null;
  error?: string;
  code?: string;
}

interface ReposResponse {
  success: boolean;
  repos: GitHubRepo[];
  error?: string;
  code?: string;
}

interface WorkflowsResponse {
  success: boolean;
  workflows: GitHubWorkflow[];
  error?: string;
  code?: string;
}

interface WorkflowRunsResponse {
  success: boolean;
  runs: GitHubWorkflowRun[];
  total_count?: number;
  error?: string;
  code?: string;
}

// ============================================================
// API 함수
// ============================================================

/**
 * GitHub 설정을 조회합니다.
 */
async function fetchGitHubSettings(): Promise<SettingsResponse> {
  const response = await fetch('/api/github', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, settings: null, error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, settings: null, error: errorData.error || 'GitHub 설정 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, settings: data.settings ?? null };
}

/**
 * GitHub 토큰을 등록/업데이트합니다.
 * @param accessToken GitHub Personal Access Token
 */
async function saveGitHubSettings(accessToken: string): Promise<ApiResponse<GitHubSettingsDto>> {
  const response = await fetch('/api/github', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'GitHub 토큰 등록에 실패했습니다');
  }

  return { success: true, data: data.settings };
}

/**
 * GitHub 연동을 해제합니다.
 */
async function deleteGitHubSettings(): Promise<ApiResponse<void>> {
  const response = await fetch('/api/github', {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'GitHub 연동 해제에 실패했습니다');
  }

  return { success: true };
}

/**
 * 레포지토리 목록을 조회합니다.
 * @param filter 필터 옵션
 */
async function fetchRepositories(filter?: RepositoryFilter): Promise<ReposResponse> {
  const params = new URLSearchParams();

  if (filter?.type) params.set('type', filter.type);
  if (filter?.sort) params.set('sort', filter.sort);
  if (filter?.direction) params.set('direction', filter.direction);
  if (filter?.per_page) params.set('per_page', filter.per_page.toString());
  if (filter?.page) params.set('page', filter.page.toString());

  const queryString = params.toString();
  const url = queryString ? `/api/github/repos?${queryString}` : '/api/github/repos';

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, repos: [], error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, repos: [], error: errorData.error || '레포지토리 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, repos: data.repos ?? [] };
}

/**
 * 워크플로우 목록을 조회합니다.
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 */
async function fetchWorkflows(owner: string, repo: string): Promise<WorkflowsResponse> {
  const response = await fetch(`/api/github/repos/${owner}/${repo}/workflows`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, workflows: [], error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, workflows: [], error: errorData.error || '워크플로우 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, workflows: data.workflows ?? [] };
}

/**
 * 워크플로우 실행 기록을 조회합니다.
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @param filter 필터 옵션
 */
async function fetchWorkflowRuns(
  owner: string,
  repo: string,
  filter?: WorkflowRunFilter
): Promise<WorkflowRunsResponse> {
  const params = new URLSearchParams();

  if (filter?.actor) params.set('actor', filter.actor);
  if (filter?.branch) params.set('branch', filter.branch);
  if (filter?.event) params.set('event', filter.event);
  if (filter?.status) params.set('status', filter.status);
  if (filter?.per_page) params.set('per_page', filter.per_page.toString());
  if (filter?.page) params.set('page', filter.page.toString());

  const queryString = params.toString();
  const url = queryString
    ? `/api/github/repos/${owner}/${repo}/runs?${queryString}`
    : `/api/github/repos/${owner}/${repo}/runs`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { success: false, runs: [], error: '로그인이 필요합니다', code: 'UNAUTHORIZED' };
    }
    const errorData = await response.json().catch(() => ({}));
    return { success: false, runs: [], error: errorData.error || '워크플로우 실행 기록 조회 실패', code: errorData.code };
  }

  const data = await response.json();
  return { success: true, runs: data.runs ?? [], total_count: data.total_count };
}

// ============================================================
// Query 훅
// ============================================================

/**
 * GitHub 설정을 조회하는 훅
 *
 * @returns settings - GitHubSettingsDto 또는 null
 * @returns hasToken - 토큰 등록 여부
 * @returns isLoading - 로딩 중 여부
 * @returns error - 에러 객체
 * @returns refetch - 재조회 함수
 */
export function useGitHubSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['github', 'settings'],
    queryFn: fetchGitHubSettings,
    staleTime: 30 * 1000, // 30초
    retry: false, // 인증 에러 시 재시도하지 않음
  });

  return {
    settings: data?.success ? data.settings : null,
    hasToken: data?.success ? !!data.settings?.hasToken : false,
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    refetch,
  };
}

/**
 * 레포지토리 목록을 조회하는 훅
 *
 * @param filter 필터 옵션 (type, sort, direction, per_page, page)
 * @param enabled 활성화 여부 (토큰이 있을 때만 조회)
 * @returns repos - GitHubRepo 배열
 * @returns isLoading - 로딩 중 여부
 * @returns error - 에러 객체
 * @returns refetch - 재조회 함수
 */
export function useRepositories(filter?: RepositoryFilter, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['github', 'repos', filter],
    queryFn: () => fetchRepositories(filter),
    staleTime: 60 * 1000, // 1분
    enabled, // 토큰이 있을 때만 조회
    retry: false,
  });

  return {
    repos: data?.success ? data.repos : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * 워크플로우 목록을 조회하는 훅
 *
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @param enabled 활성화 여부 (레포 선택 시만 조회)
 * @returns workflows - GitHubWorkflow 배열
 * @returns isLoading - 로딩 중 여부
 * @returns error - 에러 객체
 * @returns refetch - 재조회 함수
 */
export function useWorkflows(owner: string, repo: string, enabled: boolean = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['github', 'workflows', owner, repo],
    queryFn: () => fetchWorkflows(owner, repo),
    staleTime: 60 * 1000, // 1분
    enabled: enabled && !!owner && !!repo,
    retry: false,
  });

  return {
    workflows: data?.success ? data.workflows : [],
    isLoading,
    error: error as Error | null,
    errorCode: data?.code,
    errorMessage: data?.error,
    refetch,
  };
}

/**
 * useWorkflowRuns 훅 옵션
 */
interface UseWorkflowRunsOptions {
  /** 필터 옵션 */
  filter?: WorkflowRunFilter;
  /** 활성화 여부 */
  enabled?: boolean;
  /** 자동 새로고침 간격 (ms) */
  refreshInterval?: number;
}

/**
 * 워크플로우 실행 기록을 조회하는 훅
 *
 * @param owner 레포지토리 소유자
 * @param repo 레포지토리 이름
 * @param options 옵션 (filter, enabled, refreshInterval)
 * @returns runs - GitHubWorkflowRun 배열
 * @returns totalCount - 전체 실행 기록 수
 * @returns isLoading - 로딩 중 여부
 * @returns error - 에러 객체
 * @returns refetch - 재조회 함수
 */
export function useWorkflowRuns(
  owner: string,
  repo: string,
  options: UseWorkflowRunsOptions = {}
) {
  const { filter, enabled = true, refreshInterval } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['github', 'runs', owner, repo, filter],
    queryFn: () => fetchWorkflowRuns(owner, repo, filter),
    staleTime: 30 * 1000, // 30초 (실행 중인 워크플로우가 있을 수 있음)
    enabled: enabled && !!owner && !!repo,
    retry: false,
    refetchInterval: refreshInterval, // 자동 새로고침
  });

  return {
    runs: data?.success ? data.runs : [],
    totalCount: data?.total_count ?? 0,
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
 * GitHub 설정 생성/업데이트/삭제 mutation 훅
 *
 * @returns saveSettings - 토큰 등록 mutation
 * @returns deleteSettings - 연동 해제 mutation
 */
export function useGitHubSettingsMutation() {
  const queryClient = useQueryClient();

  const saveSettings = useMutation({
    mutationFn: (input: { accessToken: string }) => saveGitHubSettings(input.accessToken),
    onSuccess: () => {
      // 설정 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['github', 'settings'] });
      // 레포지토리 캐시도 무효화 (새 토큰으로 조회 필요)
      queryClient.invalidateQueries({ queryKey: ['github', 'repos'] });
    },
  });

  const deleteSettings = useMutation({
    mutationFn: deleteGitHubSettings,
    onSuccess: () => {
      // 모든 GitHub 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['github'] });
    },
  });

  return {
    saveSettings,
    deleteSettings,
  };
}
