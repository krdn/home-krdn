'use client';

/**
 * LogList 컴포넌트
 * 가상화된 로그 목록 (대용량 로그 처리)
 *
 * Phase 37: Log Viewer UI
 * - @tanstack/react-virtual 사용
 */
import { memo, useRef, useMemo, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, FileText, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LogEntryComponent } from './LogEntry';
import type { LogEntry } from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

export interface LogListProps {
  /** 로그 목록 */
  logs: LogEntry[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 자동 스크롤 (새 로그 추가 시 하단으로) */
  autoScroll?: boolean;
  /** 최대 높이 (px) */
  maxHeight?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 클래스명 */
  className?: string;
}

// ============================================================
// 상수
// ============================================================

/** 로그 행 높이 (px) */
const LOG_ITEM_HEIGHT = 28;

/** 기본 최대 높이 */
const DEFAULT_MAX_HEIGHT = 500;

/** 가상화 적용 임계값 (이 개수 이상일 때) */
const VIRTUALIZATION_THRESHOLD = 50;

/** overscan (미리 렌더링할 행 수) */
const OVERSCAN = 5;

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 가상화된 로그 목록 컴포넌트
 */
export const LogList = memo(function LogList({
  logs,
  isLoading = false,
  emptyMessage = '로그가 없습니다.',
  autoScroll = true,
  maxHeight = DEFAULT_MAX_HEIGHT,
  compact = false,
  className,
}: LogListProps) {
  // 스크롤 컨테이너 ref
  const parentRef = useRef<HTMLDivElement>(null);

  // 사용자 스크롤 상태 (자동 스크롤 비활성화용)
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // 이전 로그 수 (새 로그 감지용)
  const prevLogCountRef = useRef(logs.length);

  // 가상화 적용 여부
  const shouldVirtualize = logs.length >= VIRTUALIZATION_THRESHOLD;

  // 가상화 설정
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LOG_ITEM_HEIGHT,
    overscan: OVERSCAN,
    enabled: shouldVirtualize,
  });

  // ============================================================
  // 스크롤 제어
  // ============================================================

  /**
   * 하단으로 스크롤
   */
  const scrollToBottom = useCallback(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, []);

  /**
   * 사용자 스크롤 감지
   */
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // 사용자가 위로 스크롤하면 자동 스크롤 비활성화
    if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
      isUserScrollingRef.current = true;
    }

    // 하단에 도달하면 자동 스크롤 재활성화
    if (isAtBottom) {
      isUserScrollingRef.current = false;
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  /**
   * 새 로그 추가 시 자동 스크롤
   */
  useEffect(() => {
    if (
      autoScroll &&
      !isUserScrollingRef.current &&
      logs.length > prevLogCountRef.current
    ) {
      // 약간의 지연 후 스크롤 (DOM 업데이트 대기)
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
    prevLogCountRef.current = logs.length;
  }, [logs.length, autoScroll, scrollToBottom]);

  // ============================================================
  // 렌더링
  // ============================================================

  // 로딩 상태
  if (isLoading && logs.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // 빈 상태
  if (logs.length === 0) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // 계산된 높이
  const listHeight = Math.min(logs.length * LOG_ITEM_HEIGHT, maxHeight);

  return (
    <Card className={cn('overflow-hidden relative', className)}>
      <CardContent className="p-0">
        {/* 스크롤 컨테이너 */}
        <div
          ref={parentRef}
          onScroll={handleScroll}
          className="overflow-auto scrollbar-thin bg-card font-mono"
          style={{ height: listHeight }}
        >
          {shouldVirtualize ? (
            // 가상화 리스트
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const log = logs[virtualRow.index];
                return (
                  <div
                    key={log.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <LogEntryComponent
                      log={log}
                      compact={compact}
                      expandable={!compact}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // 일반 리스트 (가상화 임계값 미만)
            <div>
              {logs.map((log) => (
                <LogEntryComponent
                  key={log.id}
                  log={log}
                  compact={compact}
                  expandable={!compact}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 스크롤 버튼 (사용자가 위로 스크롤했을 때) */}
        {isUserScrollingRef.current && logs.length > VIRTUALIZATION_THRESHOLD && (
          <div className="absolute bottom-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                isUserScrollingRef.current = false;
                scrollToBottom();
              }}
              className="shadow-lg"
            >
              <ArrowDown className="mr-1 h-3 w-3" />
              최신 로그
            </Button>
          </div>
        )}

        {/* 로딩 오버레이 (추가 로딩 시) */}
        {isLoading && logs.length > 0 && (
          <div className="absolute top-2 right-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default LogList;
