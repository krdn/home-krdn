'use client';

/**
 * RepoList 컴포넌트
 *
 * GitHub 레포지토리 목록을 테이블/카드 형식으로 표시합니다.
 * 필터링, 검색, 정렬 기능을 제공합니다.
 *
 * Phase 35: CI/CD Dashboard
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  AlertCircle,
  ExternalLink,
  Lock,
  Globe,
  Star,
  GitFork,
  ChevronDown,
  Code,
  FolderGit2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRepositories } from '@/hooks/useGitHub';
import type { GitHubRepo, RepositoryFilter } from '@/types/github';

// ============================================================
// 언어 색상 매핑
// ============================================================

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  Java: 'bg-red-500',
  'C#': 'bg-purple-500',
  C: 'bg-gray-500',
  'C++': 'bg-pink-500',
  Ruby: 'bg-red-600',
  PHP: 'bg-indigo-400',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-400',
  Shell: 'bg-green-600',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-400',
  Vue: 'bg-emerald-500',
};

// ============================================================
// Props
// ============================================================

interface RepoListProps {
  /** 토큰 등록 여부 */
  hasToken?: boolean;
  /** 레포지토리 선택 콜백 */
  onSelectRepo?: (repo: GitHubRepo) => void;
  /** 선택된 레포지토리 full_name */
  selectedRepo?: string | null;
}

// ============================================================
// 필터 타입
// ============================================================

type RepoType = 'all' | 'owner' | 'public' | 'private';
type SortType = 'updated' | 'created' | 'pushed' | 'full_name';

// ============================================================
// 컴포넌트
// ============================================================

export function RepoList({ hasToken = false, onSelectRepo, selectedRepo }: RepoListProps) {
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<RepoType>('all');
  const [sortFilter, setSortFilter] = useState<SortType>('updated');
  const [searchQuery, setSearchQuery] = useState('');

  // 필터 옵션 구성
  const filter: RepositoryFilter = useMemo(
    () => ({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      sort: sortFilter,
      direction: 'desc' as const,
      per_page: 50,
    }),
    [typeFilter, sortFilter]
  );

  // 레포지토리 목록 조회
  const { repos, isLoading, error, errorMessage, refetch } = useRepositories(filter, hasToken);

  // 클라이언트 필터링 (검색)
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repos;

    const query = searchQuery.toLowerCase();
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false) ||
        (repo.language?.toLowerCase().includes(query) ?? false)
    );
  }, [repos, searchQuery]);

  // 레포 클릭 핸들러
  const handleRepoClick = useCallback(
    (repo: GitHubRepo) => {
      onSelectRepo?.(repo);
    },
    [onSelectRepo]
  );

  // 상대 시간 포맷
  const formatRelativeTime = useCallback((dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  }, []);

  // 토큰 미등록 시
  if (!hasToken) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <FolderGit2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-2 font-medium">GitHub 연동이 필요합니다</p>
          <p className="text-sm text-muted-foreground">
            위의 GitHub 설정에서 Personal Access Token을 등록하세요
          </p>
        </CardContent>
      </Card>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error || errorMessage) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 font-medium">레포지토리를 불러오지 못했습니다</p>
          <p className="mb-4 text-sm text-muted-foreground">{errorMessage || error?.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 섹션 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 검색 */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="레포지토리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 필터 드롭다운 */}
        <div className="flex flex-wrap gap-2">
          {/* 타입 필터 */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as RepoType)}
              className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">모든 레포</option>
              <option value="owner">소유</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 정렬 필터 */}
          <div className="relative">
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value as SortType)}
              className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="updated">최근 업데이트</option>
              <option value="pushed">최근 푸시</option>
              <option value="created">생성일</option>
              <option value="full_name">이름순</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 새로고침 버튼 */}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 레포지토리 목록 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5" />
            레포지토리 ({filteredRepos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRepos.length === 0 ? (
            <div className="py-12 text-center">
              <FolderGit2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다' : '레포지토리가 없습니다'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">레포지토리</th>
                    <th className="hidden pb-3 pr-4 font-medium sm:table-cell">언어</th>
                    <th className="hidden pb-3 pr-4 font-medium md:table-cell">Stars</th>
                    <th className="hidden pb-3 pr-4 font-medium lg:table-cell">최근 푸시</th>
                    <th className="pb-3 text-right font-medium">링크</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepos.map((repo) => (
                    <tr
                      key={repo.id}
                      onClick={() => handleRepoClick(repo)}
                      className={`cursor-pointer border-b last:border-0 transition-colors ${
                        selectedRepo === repo.full_name
                          ? 'bg-primary/10'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* 레포지토리명 */}
                      <td className="py-3 pr-4">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{repo.name}</span>
                              {repo.private ? (
                                <Badge variant="secondary" className="shrink-0">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Private
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="shrink-0">
                                  <Globe className="mr-1 h-3 w-3" />
                                  Public
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                                {repo.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 언어 */}
                      <td className="hidden py-3 pr-4 sm:table-cell">
                        {repo.language ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-3 w-3 rounded-full ${
                                languageColors[repo.language] || 'bg-gray-400'
                              }`}
                            />
                            <span className="text-sm">{repo.language}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Stars / Forks */}
                      <td className="hidden py-3 pr-4 md:table-cell">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {repo.forks_count}
                          </span>
                        </div>
                      </td>

                      {/* 최근 푸시 */}
                      <td className="hidden py-3 pr-4 lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatRelativeTime(repo.pushed_at)}
                        </div>
                      </td>

                      {/* GitHub 링크 */}
                      <td className="py-3 text-right">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Code className="h-4 w-4" />
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
