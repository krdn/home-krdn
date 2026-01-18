'use client';

import { useState, memo, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Play,
  Square,
  RotateCw,
  RefreshCw,
  Box,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useContainers, ContainerData } from '@/hooks/useContainers';
import { useAuth } from '@/hooks/useAuth';

/**
 * 컨테이너 행 Props
 */
interface ContainerRowProps {
  container: ContainerData;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  isLoading: boolean;
  /** 컨테이너 제어 권한 여부 (user 이상) */
  canControl: boolean;
}

/**
 * 컨테이너 행 컴포넌트
 * memo()로 감싸서 해당 컨테이너 데이터 변경 시에만 리렌더링됩니다.
 */
const ContainerRow = memo(function ContainerRow({
  container,
  onAction,
  isLoading,
  canControl,
}: ContainerRowProps) {
  const isRunning = container.state === 'running';

  // 액션 핸들러 메모이제이션 - 컨테이너별로 안정적인 참조 유지
  const handleStart = useCallback(
    () => onAction(container.name, 'start'),
    [container.name, onAction]
  );
  const handleStop = useCallback(
    () => onAction(container.name, 'stop'),
    [container.name, onAction]
  );
  const handleRestart = useCallback(
    () => onAction(container.name, 'restart'),
    [container.name, onAction]
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-3 w-3 rounded-full ${
            isRunning ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{container.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {container.image}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant={isRunning ? 'default' : 'secondary'}>
              {container.state}
            </Badge>
            {container.ports.length > 0 && (
              <Badge variant="outline">{container.ports.join(', ')}</Badge>
            )}
          </div>
        </div>
      </div>
      {/* RBAC: user 이상 역할만 컨테이너 제어 버튼 표시 */}
      {canControl && (
        <div className="flex gap-2">
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                disabled={isLoading}
              >
                <RotateCw className="mr-1 h-3 w-3" />
                Restart
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={isLoading}
              >
                <Square className="mr-1 h-3 w-3" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
            >
              <Play className="mr-1 h-3 w-3" />
              Start
            </Button>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 컨테이너 ID와 상태, 로딩 상태, 권한 비교
  return (
    prevProps.container.id === nextProps.container.id &&
    prevProps.container.state === nextProps.container.state &&
    prevProps.container.name === nextProps.container.name &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.canControl === nextProps.canControl
  );
});

// 가상화 리스트 상수
const ITEM_HEIGHT = 120; // 컨테이너 행 높이 (px)
const LIST_MAX_HEIGHT = 800; // 최대 리스트 높이 (px)
const VIRTUALIZATION_THRESHOLD = 50; // 이 개수 이상일 때 가상화 적용

/** 프로젝트 그룹 인터페이스 */
interface ProjectGroup {
  name: string;
  containers: ContainerData[];
  runningCount: number;
}

export function ContainerList() {
  const { containers, summary, loading, error, refetch, performAction } =
    useContainers(10000);
  const { hasPermission } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  // 가상화를 위한 스크롤 컨테이너 ref
  const parentRef = useRef<HTMLDivElement>(null);

  // RBAC: user 이상 역할만 컨테이너 제어 가능
  const canControlContainers = hasPermission('docker', 'write');

  // 액션 핸들러 메모이제이션 - ContainerRow에 안정적인 참조 전달
  const handleAction = useCallback(
    async (id: string, action: 'start' | 'stop' | 'restart') => {
      setActionLoading(id);
      await performAction(id, action);
      setActionLoading(null);
    },
    [performAction]
  );

  // 필터링된 컨테이너 목록 메모이제이션
  const filteredContainers = useMemo(() => {
    return containers.filter((c) => {
      if (filter === 'running') return c.state === 'running';
      if (filter === 'stopped') return c.state !== 'running';
      return true;
    });
  }, [containers, filter]);

  // 프로젝트별 그룹화 (docker-compose project 기준)
  const groupedContainers = useMemo(() => {
    const groups = new Map<string, ContainerData[]>();

    for (const container of filteredContainers) {
      const projectName = container.project || 'standalone';
      if (!groups.has(projectName)) {
        groups.set(projectName, []);
      }
      groups.get(projectName)!.push(container);
    }

    // 프로젝트 그룹 배열로 변환 (이름순 정렬, standalone은 마지막)
    const result: ProjectGroup[] = [];
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'standalone') return 1;
      if (b === 'standalone') return -1;
      return a.localeCompare(b);
    });

    for (const name of sortedKeys) {
      const groupContainers = groups.get(name)!;
      result.push({
        name,
        containers: groupContainers,
        runningCount: groupContainers.filter((c) => c.state === 'running').length,
      });
    }

    return result;
  }, [filteredContainers]);

  // 프로젝트 접기/펼치기 토글
  const toggleProject = useCallback((projectName: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  }, []);

  // 가상화 설정 (20개 이상일 때만 활성화)
  const shouldVirtualize = filteredContainers.length >= VIRTUALIZATION_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: filteredContainers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3,
    enabled: shouldVirtualize,
  });

  if (loading) {
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

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <p className="mb-2 font-medium">Failed to connect to Docker</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {summary && (
            <>
              <Badge variant="outline" className="gap-1">
                <Box className="h-3 w-3" />
                Total: {summary.total}
              </Badge>
              <Badge variant="default" className="gap-1 bg-green-600">
                Running: {summary.running}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                Stopped: {summary.stopped}
              </Badge>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'running' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('running')}
          >
            Running
          </Button>
          <Button
            variant={filter === 'stopped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('stopped')}
          >
            Stopped
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Container List */}
      {filteredContainers.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No containers found
        </p>
      ) : shouldVirtualize ? (
        // 가상화 리스트: 20개 이상일 때 사용
        <div
          ref={parentRef}
          className="overflow-auto scrollbar-thin"
          style={{
            height: Math.min(
              filteredContainers.length * ITEM_HEIGHT,
              LIST_MAX_HEIGHT
            ),
          }}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const container = filteredContainers[virtualRow.index];
              return (
                <div
                  key={container.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <ContainerRow
                    container={container}
                    onAction={handleAction}
                    isLoading={actionLoading === container.name}
                    canControl={canControlContainers}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // 일반 리스트: 프로젝트별 그룹화
        <div className="space-y-4">
          {groupedContainers.map((group) => {
            const isCollapsed = collapsedProjects.has(group.name);
            return (
              <div key={group.name} className="rounded-lg border bg-card">
                {/* 프로젝트 헤더 */}
                <button
                  type="button"
                  onClick={() => toggleProject(group.name)}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {group.name === 'standalone' ? 'Standalone' : group.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {group.containers.length}
                    </Badge>
                    {group.runningCount > 0 && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        {group.runningCount} running
                      </Badge>
                    )}
                  </div>
                </button>

                {/* 컨테이너 목록 (접힘 상태가 아닐 때만) */}
                {!isCollapsed && (
                  <div className="space-y-2 border-t p-3">
                    {group.containers.map((container) => (
                      <ContainerRow
                        key={container.id}
                        container={container}
                        onAction={handleAction}
                        isLoading={actionLoading === container.name}
                        canControl={canControlContainers}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
