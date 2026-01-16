'use client';

/**
 * GitHub Admin 페이지
 *
 * GitHub 연동 설정 및 CI/CD 대시보드 페이지
 *
 * Phase 35: CI/CD Dashboard
 *
 * - GitHub 토큰 등록/해제
 * - 계정 정보 표시
 * - 레포지토리 목록 조회
 * - 레포 선택 시 워크플로우 대시보드 표시
 */

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Github, Loader2, ArrowLeft, GitBranch, PlayCircle } from 'lucide-react';
import { AdminOnly } from '@/components/admin/RoleGuard';
import { Button } from '@/components/ui/Button';
import { useGitHubSettings } from '@/hooks/useGitHub';
import type { GitHubRepo, GitHubWorkflow } from '@/types/github';

// Dynamic Import: GitHubSetup, RepoList, WorkflowList, WorkflowRunList 지연 로딩
const GitHubSetup = dynamic(
  () => import('@/components/github/GitHubSetup').then((mod) => mod.GitHubSetup),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const RepoList = dynamic(
  () => import('@/components/github/RepoList').then((mod) => mod.RepoList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const WorkflowList = dynamic(
  () => import('@/components/github/WorkflowList').then((mod) => mod.WorkflowList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const WorkflowRunList = dynamic(
  () => import('@/components/github/WorkflowRunList').then((mod) => mod.WorkflowRunList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

/**
 * GitHub Admin 페이지 컴포넌트
 */
export default function GitHubAdminPage() {
  // GitHub 설정 조회
  const { hasToken, refetch } = useGitHubSettings();

  // 선택된 레포지토리 상태
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // 선택된 워크플로우 상태 (특정 워크플로우의 실행 기록만 표시)
  const [selectedWorkflow, setSelectedWorkflow] = useState<GitHubWorkflow | null>(null);

  // owner/repo 파싱
  const [owner, repo] = useMemo(() => {
    if (!selectedRepo) return ['', ''];
    const parts = selectedRepo.full_name.split('/');
    return [parts[0] || '', parts[1] || ''];
  }, [selectedRepo]);

  // 설정 변경 핸들러
  const handleSettingsChange = useCallback(() => {
    refetch();
    setSelectedRepo(null);
    setSelectedWorkflow(null);
  }, [refetch]);

  // 레포지토리 선택 핸들러
  const handleSelectRepo = useCallback((repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setSelectedWorkflow(null); // 레포 변경 시 워크플로우 선택 해제
  }, []);

  // 레포지토리 선택 해제 (뒤로가기)
  const handleDeselectRepo = useCallback(() => {
    setSelectedRepo(null);
    setSelectedWorkflow(null);
  }, []);

  // 워크플로우 선택 핸들러
  const handleSelectWorkflow = useCallback((workflow: GitHubWorkflow) => {
    // 같은 워크플로우 클릭 시 선택 해제 (토글)
    setSelectedWorkflow((prev) => (prev?.id === workflow.id ? null : workflow));
  }, []);

  return (
    <AdminOnly fallback={<p className="p-4 text-muted-foreground">GitHub 관리 권한이 없습니다. Admin 역할이 필요합니다.</p>}>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Github className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">GitHub 연동</h1>
              <p className="text-sm text-muted-foreground">
                GitHub 레포지토리와 CI/CD 워크플로우를 관리합니다.
              </p>
            </div>
          </div>
        </div>

        {/* GitHub 설정 (토큰 등록/계정 정보) */}
        <GitHubSetup onSettingsChange={handleSettingsChange} />

        {/* 레포지토리 미선택 시: 레포 목록 표시 */}
        {hasToken && !selectedRepo && (
          <RepoList
            hasToken={hasToken}
            onSelectRepo={handleSelectRepo}
            selectedRepo={null}
          />
        )}

        {/* 레포지토리 선택 시: 워크플로우 대시보드 */}
        {hasToken && selectedRepo && (
          <div className="space-y-6">
            {/* 선택된 레포 헤더 + 뒤로가기 */}
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectRepo}
                className="shrink-0"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                목록
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-semibold truncate">{selectedRepo.full_name}</span>
                </div>
                {selectedRepo.description && (
                  <p className="mt-1 text-sm text-muted-foreground truncate">
                    {selectedRepo.description}
                  </p>
                )}
              </div>
              {selectedRepo.default_branch && (
                <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                  <GitBranch className="h-4 w-4" />
                  <span>{selectedRepo.default_branch}</span>
                </div>
              )}
            </div>

            {/* 워크플로우 대시보드 레이아웃: 반응형 */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* 왼쪽: 워크플로우 목록 */}
              <div className="order-2 lg:order-1">
                <WorkflowList
                  owner={owner}
                  repo={repo}
                  onWorkflowSelect={handleSelectWorkflow}
                  selectedWorkflowId={selectedWorkflow?.id ?? null}
                />
              </div>

              {/* 오른쪽: 워크플로우 실행 기록 */}
              <div className="order-1 lg:order-2">
                {selectedWorkflow ? (
                  <div className="space-y-4">
                    {/* 선택된 워크플로우 표시 */}
                    <div className="flex items-center gap-2 rounded-lg border bg-primary/5 p-3">
                      <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-medium truncate">{selectedWorkflow.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWorkflow(null)}
                        className="ml-auto shrink-0 h-7 px-2 text-xs"
                      >
                        전체 보기
                      </Button>
                    </div>
                    <WorkflowRunList
                      owner={owner}
                      repo={repo}
                      workflowId={selectedWorkflow.id}
                      autoRefresh
                    />
                  </div>
                ) : (
                  <WorkflowRunList
                    owner={owner}
                    repo={repo}
                    autoRefresh
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
