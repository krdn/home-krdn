'use client';

/**
 * PortList 컴포넌트
 *
 * 포트 레지스트리 목록을 테이블 형식으로 표시합니다.
 * 필터링, 검색, 수정/삭제 기능을 제공합니다.
 *
 * Phase 33: Port Registry System
 */

import { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Network,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortsQuery, useDeletePort } from '@/hooks/usePorts';
import {
  PORT_CATEGORIES,
  PORT_ENVIRONMENTS,
  PORT_STATUSES,
  type PortRegistryDto,
  type PortCategory,
  type PortEnvironment,
  type PortStatus,
  type PortFilterOptions,
} from '@/types/port';

// ============================================================
// 라벨 매핑
// ============================================================

const categoryLabels: Record<PortCategory, string> = {
  ai: 'AI',
  web: 'Web',
  n8n: 'N8N',
  system: 'System',
  database: 'Database',
  monitoring: 'Monitoring',
  other: '기타',
};

const environmentLabels: Record<PortEnvironment, string> = {
  development: 'Dev',
  staging: 'Staging',
  production: 'Prod',
};

const statusLabels: Record<PortStatus, string> = {
  active: '활성',
  reserved: '예약',
  deprecated: '폐기',
};

const statusColors: Record<PortStatus, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  reserved: 'secondary',
  deprecated: 'destructive',
};

// ============================================================
// Props
// ============================================================

interface PortListProps {
  onEdit?: (port: PortRegistryDto) => void;
}

// ============================================================
// 컴포넌트
// ============================================================

export function PortList({ onEdit }: PortListProps) {
  // 필터 상태
  const [categoryFilter, setCategoryFilter] = useState<PortCategory | ''>('');
  const [environmentFilter, setEnvironmentFilter] = useState<PortEnvironment | ''>('');
  const [statusFilter, setStatusFilter] = useState<PortStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 필터 옵션 구성
  const filters: PortFilterOptions = useMemo(
    () => ({
      category: categoryFilter || undefined,
      environment: environmentFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    }),
    [categoryFilter, environmentFilter, statusFilter, searchQuery]
  );

  // 포트 목록 조회
  const { ports, total, isLoading, error, refetch } = usePortsQuery(filters);

  // 삭제 mutation
  const deletePort = useDeletePort();

  // 삭제 핸들러
  const handleDelete = useCallback(
    async (port: PortRegistryDto) => {
      if (!confirm(`포트 ${port.port} (${port.projectName})을(를) 삭제하시겠습니까?`)) {
        return;
      }

      try {
        await deletePort.mutateAsync(port.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : '삭제에 실패했습니다');
      }
    },
    [deletePort]
  );

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
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 font-medium">포트 목록을 불러오지 못했습니다</p>
          <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
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
            placeholder="프로젝트명, 설명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 필터 드롭다운 */}
        <div className="flex flex-wrap gap-2">
          {/* 카테고리 필터 */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as PortCategory | '')}
              className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">모든 카테고리</option>
              {PORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 환경 필터 */}
          <div className="relative">
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value as PortEnvironment | '')}
              className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">모든 환경</option>
              {PORT_ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {environmentLabels[env]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PortStatus | '')}
              className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">모든 상태</option>
              {PORT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* 새로고침 버튼 */}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 포트 목록 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            포트 레지스트리 ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ports.length === 0 ? (
            <div className="py-12 text-center">
              <Network className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">등록된 포트가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">
                "포트 추가" 버튼을 클릭하여 새 포트를 등록하세요
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">포트</th>
                    <th className="pb-3 pr-4 font-medium">프로젝트</th>
                    <th className="hidden pb-3 pr-4 font-medium sm:table-cell">환경</th>
                    <th className="hidden pb-3 pr-4 font-medium md:table-cell">상태</th>
                    <th className="hidden pb-3 pr-4 font-medium lg:table-cell">URL</th>
                    <th className="pb-3 text-right font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port) => (
                    <tr
                      key={port.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      {/* 포트 번호 */}
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{port.port}</span>
                          {port.category && (
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[port.category]}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* 프로젝트명 */}
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium">{port.projectName}</p>
                          {port.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {port.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 환경 */}
                      <td className="hidden py-3 pr-4 sm:table-cell">
                        <Badge variant="secondary">
                          {environmentLabels[port.environment]}
                        </Badge>
                      </td>

                      {/* 상태 */}
                      <td className="hidden py-3 pr-4 md:table-cell">
                        <Badge variant={statusColors[port.status]}>
                          {statusLabels[port.status]}
                        </Badge>
                      </td>

                      {/* URL */}
                      <td className="hidden py-3 pr-4 lg:table-cell">
                        <div className="flex gap-1">
                          {port.internalUrl && (
                            <a
                              href={port.internalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              title="내부 URL"
                            >
                              Internal
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {port.externalUrl && (
                            <a
                              href={port.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              title="외부 URL"
                            >
                              External
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {!port.internalUrl && !port.externalUrl && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>

                      {/* 액션 */}
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(port)}
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(port)}
                            disabled={deletePort.isPending}
                            className="text-destructive hover:text-destructive"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
