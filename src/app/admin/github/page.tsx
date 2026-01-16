'use client';

/**
 * GitHub Admin 페이지
 *
 * GitHub 연동 설정 및 레포지토리 목록 조회 페이지
 *
 * Phase 35: CI/CD Dashboard
 *
 * - GitHub 토큰 등록/해제
 * - 계정 정보 표시
 * - 레포지토리 목록 조회
 * - 레포 선택 시 상세 정보 표시 (Plan 02에서 구현)
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Github, Loader2 } from 'lucide-react';
import { AdminOnly } from '@/components/admin/RoleGuard';
import { useGitHubSettings } from '@/hooks/useGitHub';
import type { GitHubRepo } from '@/types/github';

// Dynamic Import: GitHubSetup, RepoList 지연 로딩
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

/**
 * GitHub Admin 페이지 컴포넌트
 */
export default function GitHubAdminPage() {
  // GitHub 설정 조회
  const { hasToken, refetch } = useGitHubSettings();

  // 선택된 레포지토리 상태 (Plan 02에서 상세/워크플로우 표시용)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  // 설정 변경 핸들러
  const handleSettingsChange = useCallback(() => {
    refetch();
    setSelectedRepo(null);
  }, [refetch]);

  // 레포지토리 선택 핸들러
  const handleSelectRepo = useCallback((repo: GitHubRepo) => {
    setSelectedRepo(repo);
    // TODO: Plan 02에서 상세/워크플로우 섹션 표시
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

        {/* 토큰 등록 시 레포지토리 목록 표시 */}
        {hasToken && (
          <RepoList
            hasToken={hasToken}
            onSelectRepo={handleSelectRepo}
            selectedRepo={selectedRepo?.full_name ?? null}
          />
        )}

        {/* TODO: Plan 02에서 구현 - 선택된 레포 상세/워크플로우 */}
        {selectedRepo && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              <span>선택된 레포지토리: <strong>{selectedRepo.full_name}</strong></span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              커밋 히스토리와 워크플로우 정보는 다음 계획에서 구현됩니다.
            </p>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
