'use client';

/**
 * WorkflowList 컴포넌트
 *
 * 레포지토리의 GitHub Actions 워크플로우 목록을 표시합니다.
 * 워크플로우 선택 시 해당 워크플로우 실행 기록을 표시할 수 있습니다.
 *
 * Phase 35: CI/CD Dashboard
 */

import { useCallback } from 'react';
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  PlayCircle,
  FileCode,
  CheckCircle2,
  XCircle,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWorkflows } from '@/hooks/useGitHub';
import type { GitHubWorkflow } from '@/types/github';

// ============================================================
// Props
// ============================================================

interface WorkflowListProps {
  /** 레포지토리 소유자 */
  owner: string;
  /** 레포지토리 이름 */
  repo: string;
  /** 워크플로우 선택 콜백 */
  onWorkflowSelect?: (workflow: GitHubWorkflow) => void;
  /** 선택된 워크플로우 ID */
  selectedWorkflowId?: number | null;
}

// ============================================================
// 상태별 스타일
// ============================================================

const stateStyles = {
  active: {
    icon: CheckCircle2,
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    label: '활성',
  },
  disabled_manually: {
    icon: XCircle,
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    label: '비활성 (수동)',
  },
  disabled_inactivity: {
    icon: Circle,
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    label: '비활성 (자동)',
  },
};

// ============================================================
// 컴포넌트
// ============================================================

export function WorkflowList({
  owner,
  repo,
  onWorkflowSelect,
  selectedWorkflowId,
}: WorkflowListProps) {
  // 워크플로우 목록 조회
  const { workflows, isLoading, error, errorMessage, refetch } = useWorkflows(
    owner,
    repo
  );

  // 워크플로우 클릭 핸들러
  const handleWorkflowClick = useCallback(
    (workflow: GitHubWorkflow) => {
      onWorkflowSelect?.(workflow);
    },
    [onWorkflowSelect]
  );

  // 워크플로우 파일 경로 추출 (예: .github/workflows/ci.yml → ci.yml)
  const getFileName = useCallback((path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }, []);

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
          <p className="mb-2 font-medium">워크플로우를 불러오지 못했습니다</p>
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

  // 워크플로우 없음
  if (workflows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlayCircle className="h-5 w-5" />
            GitHub Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <PlayCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-2 font-medium">워크플로우가 없습니다</p>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            이 레포지토리에 GitHub Actions 워크플로우가 설정되지 않았습니다.
          </p>
          <a
            href={`https://github.com/${owner}/${repo}/actions/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            워크플로우 생성하기
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="h-5 w-5" />
          워크플로우 ({workflows.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {workflows.map((workflow) => {
          const stateConfig = stateStyles[workflow.state] || stateStyles.active;
          const StateIcon = stateConfig.icon;
          const isSelected = selectedWorkflowId === workflow.id;

          return (
            <div
              key={workflow.id}
              onClick={() => handleWorkflowClick(workflow)}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleWorkflowClick(workflow);
                }
              }}
            >
              {/* 워크플로우 정보 */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <StateIcon
                  className={`h-5 w-5 shrink-0 ${
                    workflow.state === 'active'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{workflow.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCode className="h-3 w-3" />
                    <span className="truncate">{getFileName(workflow.path)}</span>
                  </div>
                </div>
              </div>

              {/* 상태 배지 + GitHub 링크 */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="secondary"
                  className={stateConfig.badge}
                >
                  {stateConfig.label}
                </Badge>
                <a
                  href={workflow.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                  title="GitHub Actions에서 보기"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
