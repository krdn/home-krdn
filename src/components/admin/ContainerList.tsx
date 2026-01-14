'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  RotateCw,
  RefreshCw,
  Box,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useContainers, ContainerData } from '@/hooks/useContainers';

/**
 * 컨테이너 행 Props
 */
interface ContainerRowProps {
  container: ContainerData;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  isLoading: boolean;
}

/**
 * 컨테이너 행 컴포넌트
 * memo()로 감싸서 해당 컨테이너 데이터 변경 시에만 리렌더링됩니다.
 */
const ContainerRow = memo(function ContainerRow({
  container,
  onAction,
  isLoading,
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
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 컨테이너 ID와 상태, 로딩 상태만 비교
  return (
    prevProps.container.id === nextProps.container.id &&
    prevProps.container.state === nextProps.container.state &&
    prevProps.container.name === nextProps.container.name &&
    prevProps.isLoading === nextProps.isLoading
  );
});

export function ContainerList() {
  const { containers, summary, loading, error, refetch, performAction } =
    useContainers(10000);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Containers ({filteredContainers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContainers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No containers found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredContainers.map((container) => (
                <ContainerRow
                  key={container.id}
                  container={container}
                  onAction={handleAction}
                  isLoading={actionLoading === container.name}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
