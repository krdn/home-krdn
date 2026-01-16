'use client';

/**
 * LogViewer 통합 컴포넌트
 * 로그 뷰어 메인 컴포넌트 - 모든 하위 컴포넌트 통합
 *
 * Phase 37: Log Viewer UI
 *
 * 구성:
 * - LogStats: 통계 요약
 * - LogFilter: 필터 UI
 * - LogList: 가상화된 로그 목록
 * - 실시간 스트리밍 토글
 */

import { useState, useCallback, useMemo } from 'react';
import { Radio, Pause, Play, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { LogFilter } from './LogFilter';
import { LogList } from './LogList';
import { LogStats } from './LogStats';

import { useLogs } from '@/hooks/useLogs';
import { useLogStats } from '@/hooks/useLogs';
import { useLogStream } from '@/hooks/useLogStream';

import type { LogSource, LogLevel, LogEntry } from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

export interface LogViewerProps {
  /** 컴포넌트 추가 클래스 */
  className?: string;
  /** 초기 필터: 소스 */
  initialSources?: LogSource[];
  /** 초기 필터: 레벨 */
  initialLevels?: LogLevel[];
  /** 초기 실시간 모드 */
  initialStreaming?: boolean;
  /** 기본 로그 개수 */
  defaultLimit?: number;
  /** 최대 로그 높이 (px) */
  maxHeight?: number;
}

// ============================================================
// 상수
// ============================================================

const DEFAULT_LIMIT = 100;
const DEFAULT_MAX_HEIGHT = 600;
const LOAD_MORE_COUNT = 50;

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 로그 뷰어 통합 컴포넌트
 */
export function LogViewer({
  className,
  initialSources = [],
  initialLevels = [],
  initialStreaming = false,
  defaultLimit = DEFAULT_LIMIT,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: LogViewerProps) {
  // ============================================================
  // 상태 관리
  // ============================================================

  // 필터 상태
  const [sources, setSources] = useState<LogSource[]>(initialSources);
  const [levels, setLevels] = useState<LogLevel[]>(initialLevels);
  const [search, setSearch] = useState('');

  // 실시간 모드 상태
  const [isStreaming, setIsStreaming] = useState(initialStreaming);

  // 페이지네이션 상태 (실시간 모드 OFF 시)
  const [limit, setLimit] = useState(defaultLimit);

  // ============================================================
  // 훅 연결
  // ============================================================

  // 저장된 로그 조회 (실시간 모드 OFF 시)
  const {
    logs: storedLogs,
    total: storedTotal,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
    refetch: refetchLogs,
    errorMessage: logsError,
  } = useLogs({
    sources: sources.length > 0 ? sources : undefined,
    levels: levels.length > 0 ? levels : undefined,
    search: search || undefined,
    limit,
    enabled: !isStreaming, // 실시간 모드 OFF일 때만 조회
    refetchInterval: undefined, // 자동 갱신 없음 (실시간 모드로 대체)
  });

  // 통계 조회 (항상 활성)
  const {
    stats,
    isLoading: isLoadingStats,
  } = useLogStats({
    enabled: true,
    refetchInterval: 30000, // 30초마다 갱신
  });

  // 실시간 로그 스트림 (실시간 모드 ON 시)
  const {
    logs: streamLogs,
    isStreaming: isStreamActive,
    startStream,
    stopStream,
    clearLogs: clearStreamLogs,
    connectionStatus,
  } = useLogStream({
    sources: sources.length > 0 ? sources : undefined,
    minLevel: levels.length === 1 ? levels[0] : undefined,
    enabled: isStreaming,
    maxLogs: 1000,
  });

  // ============================================================
  // 메모이제이션
  // ============================================================

  // 표시할 로그 결정
  const displayLogs = useMemo((): LogEntry[] => {
    if (isStreaming) {
      // 실시간 모드: 스트림 로그 (검색어 필터링 적용)
      if (!search) return streamLogs;
      const lowerSearch = search.toLowerCase();
      return streamLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(lowerSearch) ||
          log.sourceId.toLowerCase().includes(lowerSearch)
      );
    }
    // 저장 모드: API 조회 결과
    return storedLogs;
  }, [isStreaming, streamLogs, storedLogs, search]);

  // 로딩 상태
  const isLoading = isStreaming ? false : isLoadingLogs;

  // ============================================================
  // 핸들러
  // ============================================================

  // 실시간 모드 토글
  const handleStreamToggle = useCallback(() => {
    if (isStreaming) {
      stopStream();
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      // useLogStream의 useEffect에서 자동으로 startStream 호출
    }
  }, [isStreaming, stopStream]);

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    setSources([]);
    setLevels([]);
    setSearch('');
    setLimit(defaultLimit);
  }, [defaultLimit]);

  // 더 불러오기
  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + LOAD_MORE_COUNT);
  }, []);

  // 로그 클리어 (실시간 모드)
  const handleClearLogs = useCallback(() => {
    if (isStreaming) {
      clearStreamLogs();
    }
  }, [isStreaming, clearStreamLogs]);

  // 수동 새로고침 (저장 모드)
  const handleRefresh = useCallback(() => {
    if (!isStreaming) {
      refetchLogs();
    }
  }, [isStreaming, refetchLogs]);

  // ============================================================
  // 렌더링
  // ============================================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* 상단: 통계 요약 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">로그 통계</CardTitle>
            <LogStats stats={stats} isLoading={isLoadingStats} compact />
          </div>
        </CardHeader>
      </Card>

      {/* 중단: 필터 바 + 실시간 토글 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* 필터 */}
            <div className="flex-1">
              <LogFilter
                sources={sources}
                levels={levels}
                search={search}
                onSourcesChange={setSources}
                onLevelsChange={setLevels}
                onSearchChange={setSearch}
                onReset={handleResetFilters}
                compact
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 실시간 토글 버튼 */}
              <Button
                variant={isStreaming ? 'default' : 'outline'}
                size="sm"
                onClick={handleStreamToggle}
                className="gap-2"
              >
                {isStreaming ? (
                  <>
                    <Radio className="h-4 w-4 animate-pulse text-red-400" />
                    실시간 ON
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    실시간 OFF
                  </>
                )}
              </Button>

              {/* 새로고침 (저장 모드) */}
              {!isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetchingLogs}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isFetchingLogs && 'animate-spin')} />
                  새로고침
                </Button>
              )}

              {/* 클리어 (실시간 모드) */}
              {isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearLogs}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  클리어
                </Button>
              )}
            </div>
          </div>

          {/* 실시간 모드 인디케이터 */}
          {isStreaming && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Radio className="h-3 w-3 animate-pulse text-green-500" />
              <span className="text-muted-foreground">
                {connectionStatus === 'connected'
                  ? `실시간 로그 수신 중... (${displayLogs.length}개)`
                  : connectionStatus === 'connecting'
                    ? '연결 중...'
                    : '연결 끊김'}
              </span>
              {connectionStatus !== 'connected' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startStream}
                  className="h-6 px-2 text-xs"
                >
                  재연결
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 하단: 로그 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              로그 목록
              {!isStreaming && storedTotal > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({displayLogs.length} / {storedTotal.toLocaleString()})
                </span>
              )}
            </CardTitle>

            {/* 에러 표시 */}
            {logsError && (
              <span className="text-sm text-destructive">{logsError}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <LogList
            logs={displayLogs}
            isLoading={isLoading}
            maxHeight={maxHeight}
            autoScroll={isStreaming}
            emptyMessage={
              isStreaming
                ? '실시간 로그를 기다리는 중...'
                : search || sources.length > 0 || levels.length > 0
                  ? '필터 조건에 맞는 로그가 없습니다'
                  : '로그가 없습니다'
            }
          />

          {/* 더 불러오기 버튼 (저장 모드 + 더 많은 로그가 있을 때) */}
          {!isStreaming && storedTotal > displayLogs.length && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isFetchingLogs}
                className="gap-2"
              >
                {isFetchingLogs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                더 불러오기 ({LOAD_MORE_COUNT}개)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
