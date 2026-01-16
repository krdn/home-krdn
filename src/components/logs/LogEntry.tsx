'use client';

/**
 * LogEntry 컴포넌트
 * 개별 로그 항목 표시
 *
 * Phase 37: Log Viewer UI
 */
import { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Container, Terminal, Code } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { LogEntry as LogEntryType, LogLevel, LogSource } from '@/types/log';
import { LOG_LEVEL_COLORS, LOG_SOURCE_ICONS } from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

export interface LogEntryProps {
  /** 로그 엔트리 데이터 */
  log: LogEntryType;
  /** 메타데이터 펼치기 가능 여부 (기본: true) */
  expandable?: boolean;
  /** 컴팩트 모드 (기본: false) */
  compact?: boolean;
  /** 클래스명 */
  className?: string;
}

// ============================================================
// 상수
// ============================================================

/** 레벨 배지 variant */
const LEVEL_BADGE_VARIANTS: Record<LogLevel, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  trace: 'secondary',
  debug: 'secondary',
  info: 'default',
  warn: 'warning',
  error: 'destructive',
  fatal: 'destructive',
};

/** 레벨 배경색 (행 전체) */
const LEVEL_ROW_COLORS: Record<LogLevel, string> = {
  trace: '',
  debug: '',
  info: '',
  warn: 'bg-warning/5',
  error: 'bg-destructive/5',
  fatal: 'bg-destructive/10',
};

/** 소스 아이콘 컴포넌트 */
const SOURCE_ICONS: Record<LogSource, typeof Container> = {
  docker: Container,
  journal: Terminal,
  app: Code,
};

// ============================================================
// 유틸리티
// ============================================================

/**
 * 타임스탬프 포맷 (HH:mm:ss.SSS)
 */
function formatTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * 레벨 표시 텍스트 (대문자, 5자 고정)
 */
function formatLevel(level: LogLevel): string {
  return level.toUpperCase().padEnd(5, ' ');
}

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 개별 로그 항목 컴포넌트
 */
export const LogEntryComponent = memo(function LogEntryComponent({
  log,
  expandable = true,
  compact = false,
  className,
}: LogEntryProps) {
  // 메타데이터 펼침 상태
  const [isExpanded, setIsExpanded] = useState(false);

  // 메타데이터 유무
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  // 펼치기 토글
  const handleToggle = useCallback(() => {
    if (expandable && hasMetadata) {
      setIsExpanded((prev) => !prev);
    }
  }, [expandable, hasMetadata]);

  const SourceIcon = SOURCE_ICONS[log.source];

  return (
    <div
      className={cn(
        'font-mono text-xs leading-relaxed',
        LEVEL_ROW_COLORS[log.level],
        className
      )}
    >
      {/* 로그 행 */}
      <div
        className={cn(
          'flex items-start gap-2 px-2 py-1 hover:bg-accent/30 transition-colors',
          expandable && hasMetadata && 'cursor-pointer'
        )}
        onClick={handleToggle}
      >
        {/* 펼치기 아이콘 (메타데이터 있을 때만) */}
        {expandable && hasMetadata ? (
          <span className="flex-shrink-0 w-4 text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        ) : (
          <span className="flex-shrink-0 w-4" />
        )}

        {/* 타임스탬프 */}
        <span className="flex-shrink-0 text-muted-foreground tabular-nums">
          {formatTimestamp(log.timestamp)}
        </span>

        {/* 레벨 배지 */}
        <Badge
          variant={LEVEL_BADGE_VARIANTS[log.level]}
          className={cn(
            'flex-shrink-0 h-4 px-1 text-[10px] font-bold uppercase',
            LOG_LEVEL_COLORS[log.level]
          )}
        >
          {log.level}
        </Badge>

        {/* 소스 아이콘 + ID */}
        {!compact && (
          <span className="flex-shrink-0 flex items-center gap-1 text-muted-foreground">
            <SourceIcon className="h-3 w-3" />
            <span className="max-w-[100px] truncate" title={log.sourceId}>
              {log.sourceId}
            </span>
          </span>
        )}

        {/* 메시지 */}
        <span
          className={cn(
            'flex-1 break-all',
            log.level === 'error' && 'text-destructive',
            log.level === 'fatal' && 'text-destructive font-semibold',
            log.level === 'warn' && 'text-warning'
          )}
        >
          {log.message}
        </span>
      </div>

      {/* 메타데이터 (펼침 시) */}
      {isExpanded && hasMetadata && (
        <div className="ml-6 pl-4 border-l border-muted py-1 mb-1">
          <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

// 기본 export
export default LogEntryComponent;

// Named export for convenience
export { LogEntryComponent as LogEntry };
