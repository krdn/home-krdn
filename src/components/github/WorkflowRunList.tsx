'use client';

/**
 * WorkflowRunList 컴포넌트
 *
 * GitHub Actions 워크플로우 실행 기록을 목록으로 표시합니다.
 * 상태 필터링, 브랜치 필터링, 자동 새로고침 기능을 제공합니다.
 *
 * Phase 35: CI/CD Dashboard
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  History,
  GitBranch,
  GitCommit,
  ChevronDown,
  Filter,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWorkflowRuns } from '@/hooks/useGitHub';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import type { WorkflowRunFilter } from '@/types/github';

// ============================================================
// Props
// ============================================================

interface WorkflowRunListProps {
  /** 레포지토리 소유자 */
  owner: string;
  /** 레포지토리 이름 */
  repo: string;
  /** 특정 워크플로우 필터 (선택적) */
  workflowId?: number;
  /** 자동 새로고침 활성화 */
  autoRefresh?: boolean;
}

// ============================================================
// 필터 상태 타입
// ============================================================

type StatusFilter =
  | ''
  | 'completed'
  | 'in_progress'
  | 'queued'
  | 'waiting'
  | 'success'
  | 'failure';

// ============================================================
// 상대 시간 포맷
// ============================================================

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

/**
 * 실행 시간(duration) 계산
 */
function formatDuration(start: string, end: string): string {
  if (!start || !end) return '-';

  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs < 0) return '-';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return `${diffSec}초`;
  if (diffMin < 60) {
    const remainSec = diffSec % 60;
    return remainSec > 0 ? `${diffMin}분 ${remainSec}초` : `${diffMin}분`;
  }
  const remainMin = diffMin % 60;
  return remainMin > 0 ? `${diffHour}시간 ${remainMin}분` : `${diffHour}시간`;
}

// ============================================================
// 컴포넌트
// ============================================================

export function WorkflowRunList({
  owner,
  repo,
  workflowId,
  autoRefresh = false,
}: WorkflowRunListProps) {
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [branchFilter, setBranchFilter] = useState('');

  // API 필터 구성
  const filter: WorkflowRunFilter | undefined = useMemo(() => {
    if (!statusFilter && !branchFilter) return undefined;

    const f: WorkflowRunFilter = {
      per_page: 20,
    };

    if (statusFilter) {
      f.status = statusFilter as WorkflowRunFilter['status'];
    }
    if (branchFilter) {
      f.branch = branchFilter;
    }

    return f;
  }, [statusFilter, branchFilter]);

  // 워크플로우 실행 기록 조회
  const { runs, totalCount, isLoading, error, errorMessage, refetch } =
    useWorkflowRuns(owner, repo, {
      filter,
      refreshInterval: autoRefresh ? 30000 : undefined, // 30초마다 자동 새로고침
    });

  // 워크플로우 ID로 필터링 (클라이언트 사이드)
  const filteredRuns = useMemo(() => {
    if (!workflowId) return runs;
    return runs.filter((run) => run.workflow_id === workflowId);
  }, [runs, workflowId]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setStatusFilter('');
    setBranchFilter('');
  }, []);

  const hasActiveFilters = statusFilter || branchFilter;

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error || errorMessage) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
          <p className="mb-2 font-medium">실행 기록을 불러오지 못했습니다</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {errorMessage || error?.message}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5" />
          실행 기록 ({filteredRuns.length}
          {totalCount > filteredRuns.length && `/${totalCount}`})
        </CardTitle>

        {/* 필터 + 새로고침 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none rounded-md border bg-background py-1.5 pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="상태 필터"
            >
              <option value="">모든 상태</option>
              <option value="success">성공</option>
              <option value="failure">실패</option>
              <option value="in_progress">진행 중</option>
              <option value="queued">대기열</option>
              <option value="waiting">대기 중</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 브랜치 필터 */}
          <div className="relative">
            <GitBranch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="브랜치"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-28 rounded-md border bg-background py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="브랜치 필터"
            />
          </div>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <Filter className="mr-1 h-3 w-3" />
              초기화
            </Button>
          )}

          {/* 새로고침 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-8 w-8 p-0"
            title="새로고침"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* 실행 기록 없음 */}
        {filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="mb-2 font-medium">실행 기록이 없습니다</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? '필터 조건에 맞는 실행 기록이 없습니다'
                : '이 레포지토리에 워크플로우 실행 기록이 없습니다'}
            </p>
          </div>
        ) : (
          /* 실행 기록 테이블 */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">워크플로우</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">
                    브랜치
                  </th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    커밋
                  </th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">
                    시간
                  </th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">
                    소요
                  </th>
                  <th className="px-4 py-3 text-right font-medium">링크</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    {/* 상태 배지 */}
                    <td className="px-4 py-3">
                      <WorkflowStatusBadge
                        status={run.status}
                        conclusion={run.conclusion}
                        size="sm"
                      />
                    </td>

                    {/* 워크플로우 이름 */}
                    <td className="px-4 py-3">
                      <p className="max-w-[200px] truncate text-sm font-medium">
                        {run.name || `Run #${run.id}`}
                      </p>
                    </td>

                    {/* 브랜치 */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {run.head_branch ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span className="max-w-[100px] truncate">
                            {run.head_branch}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* 커밋 SHA */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <GitCommit className="h-3.5 w-3.5" />
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                          {run.head_sha.slice(0, 7)}
                        </code>
                      </div>
                    </td>

                    {/* 실행 시간 (상대 시간) */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatRelativeTime(run.created_at)}</span>
                      </div>
                    </td>

                    {/* 소요 시간 */}
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {run.status === 'completed'
                          ? formatDuration(run.created_at, run.updated_at)
                          : '-'}
                      </span>
                    </td>

                    {/* GitHub 링크 */}
                    <td className="px-4 py-3 text-right">
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        title="GitHub Actions에서 보기"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 자동 새로고침 표시 */}
        {autoRefresh && filteredRuns.length > 0 && (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <RefreshCw className="mr-1 inline h-3 w-3" />
            30초마다 자동 새로고침
          </div>
        )}
      </CardContent>
    </Card>
  );
}
