'use client';

/**
 * LogStats 컴포넌트
 * 로그 통계 시각화 (소스별, 레벨별 개수)
 *
 * Phase 37: Log Viewer UI
 */

import { memo } from 'react';
import { Container, Terminal, Code, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogStats as LogStatsType } from '@/types/log';
import { LOG_LEVEL_COLORS } from '@/types/log';

// ============================================================
// Props
// ============================================================

export interface LogStatsProps {
  /** 통계 데이터 */
  stats: LogStatsType | null;
  /** 로딩 중 여부 */
  isLoading?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// 상수
// ============================================================

/** 소스 아이콘 */
const SOURCE_ICONS: Record<string, typeof Container> = {
  docker: Container,
  journal: Terminal,
  app: Code,
};

/** 소스 라벨 */
const SOURCE_LABELS: Record<string, string> = {
  docker: 'Docker',
  journal: 'Journal',
  app: 'App',
};

/** 레벨 라벨 */
const LEVEL_LABELS: Record<string, string> = {
  trace: 'Trace',
  debug: 'Debug',
  info: 'Info',
  warn: 'Warn',
  error: 'Error',
  fatal: 'Fatal',
};

/** 레벨 배경색 */
const LEVEL_BG_COLORS: Record<string, string> = {
  trace: 'bg-gray-100 dark:bg-gray-800',
  debug: 'bg-gray-100 dark:bg-gray-800',
  info: 'bg-blue-100 dark:bg-blue-900/30',
  warn: 'bg-yellow-100 dark:bg-yellow-900/30',
  error: 'bg-red-100 dark:bg-red-900/30',
  fatal: 'bg-red-200 dark:bg-red-900/50',
};

// ============================================================
// 스켈레톤 컴포넌트
// ============================================================

function StatsSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex flex-wrap gap-2', compact && 'gap-1')}>
      {/* 전체 통계 스켈레톤 */}
      <div className="flex h-8 w-20 animate-pulse items-center rounded-md bg-muted" />

      {/* 소스 스켈레톤 */}
      {[1, 2, 3].map((i) => (
        <div key={`source-${i}`} className="flex h-8 w-16 animate-pulse items-center rounded-md bg-muted" />
      ))}

      {/* 레벨 스켈레톤 */}
      {[1, 2, 3, 4].map((i) => (
        <div key={`level-${i}`} className="flex h-8 w-12 animate-pulse items-center rounded-md bg-muted" />
      ))}
    </div>
  );
}

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 로그 통계 표시 컴포넌트
 */
export const LogStats = memo(function LogStats({
  stats,
  isLoading,
  compact = false,
  className,
}: LogStatsProps) {
  // 로딩 스켈레톤
  if (isLoading) {
    return <StatsSkeleton compact={compact} />;
  }

  // 통계 없음
  if (!stats) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        통계 데이터 없음
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        compact && 'gap-1',
        className
      )}
    >
      {/* 전체 로그 수 */}
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium',
          compact && 'px-1.5 py-0.5 text-xs'
        )}
      >
        <FileText className={cn('h-4 w-4', compact && 'h-3 w-3')} />
        <span>{stats.total.toLocaleString()}</span>
        <span className="text-muted-foreground">total</span>
      </div>

      {/* 구분선 */}
      <div className="hidden h-5 w-px bg-border sm:block" />

      {/* 소스별 통계 */}
      {stats.bySource.map(({ key, count }) => {
        const Icon = SOURCE_ICONS[key] || Code;
        const label = SOURCE_LABELS[key] || key;

        return (
          <div
            key={`source-${key}`}
            className={cn(
              'flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-sm',
              compact && 'px-1.5 py-0.5 text-xs'
            )}
            title={`${label}: ${count.toLocaleString()}개`}
          >
            <Icon className={cn('h-3.5 w-3.5 text-muted-foreground', compact && 'h-3 w-3')} />
            <span className="font-medium">{count.toLocaleString()}</span>
            {!compact && <span className="text-muted-foreground">{label}</span>}
          </div>
        );
      })}

      {/* 구분선 */}
      <div className="hidden h-5 w-px bg-border sm:block" />

      {/* 레벨별 통계 */}
      {stats.byLevel
        .filter(({ count }) => count > 0)
        .map(({ key, count }) => {
          const label = LEVEL_LABELS[key] || key;
          const textColor = LOG_LEVEL_COLORS[key as keyof typeof LOG_LEVEL_COLORS] || 'text-gray-500';
          const bgColor = LEVEL_BG_COLORS[key] || 'bg-gray-100';

          return (
            <div
              key={`level-${key}`}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-sm',
                bgColor,
                compact && 'px-1.5 py-0.5 text-xs'
              )}
              title={`${label}: ${count.toLocaleString()}개`}
            >
              <span className={cn('font-medium', textColor)}>{count.toLocaleString()}</span>
              {!compact && <span className={cn('text-xs', textColor)}>{label}</span>}
            </div>
          );
        })}
    </div>
  );
});
