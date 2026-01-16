'use client';

/**
 * LogFilter 컴포넌트
 * 로그 필터 UI (소스, 레벨, 검색)
 *
 * Phase 37: Log Viewer UI
 */
import { memo, useCallback, useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  LogLevel,
  LogSource,
  LOG_LEVEL_COLORS,
  LOG_SOURCE_ICONS,
} from '@/types/log';

// ============================================================
// 타입 정의
// ============================================================

export interface LogFilterProps {
  /** 선택된 소스 목록 */
  sources: LogSource[];
  /** 선택된 레벨 목록 */
  levels: LogLevel[];
  /** 검색어 */
  search: string;
  /** 소스 변경 콜백 */
  onSourcesChange: (sources: LogSource[]) => void;
  /** 레벨 변경 콜백 */
  onLevelsChange: (levels: LogLevel[]) => void;
  /** 검색어 변경 콜백 */
  onSearchChange: (search: string) => void;
  /** 필터 초기화 콜백 (선택적) */
  onReset?: () => void;
  /** 필터 접기/펼치기 (모바일용) */
  collapsible?: boolean;
  /** 컴팩트 모드 (카드 없이 인라인) */
  compact?: boolean;
  /** 클래스명 */
  className?: string;
}

// ============================================================
// 상수
// ============================================================

/** 모든 로그 소스 */
const ALL_SOURCES: LogSource[] = ['docker', 'journal', 'app'];

/** 모든 로그 레벨 */
const ALL_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/** 소스 레이블 */
const SOURCE_LABELS: Record<LogSource, string> = {
  docker: 'Docker',
  journal: 'Journal',
  app: 'App',
};

/** 레벨 레이블 */
const LEVEL_LABELS: Record<LogLevel, string> = {
  trace: 'Trace',
  debug: 'Debug',
  info: 'Info',
  warn: 'Warn',
  error: 'Error',
  fatal: 'Fatal',
};

/** 레벨 배지 색상 (Badge variant) */
const LEVEL_BADGE_VARIANTS: Record<LogLevel, 'default' | 'secondary' | 'warning' | 'destructive'> = {
  trace: 'secondary',
  debug: 'secondary',
  info: 'default',
  warn: 'warning',
  error: 'destructive',
  fatal: 'destructive',
};

/** 디바운스 시간 (ms) */
const SEARCH_DEBOUNCE_MS = 300;

// ============================================================
// 컴포넌트
// ============================================================

/**
 * 로그 필터 UI 컴포넌트
 */
export const LogFilter = memo(function LogFilter({
  sources,
  levels,
  search,
  onSourcesChange,
  onLevelsChange,
  onSearchChange,
  onReset,
  collapsible = true,
  compact = false,
  className,
}: LogFilterProps) {
  // 모바일 접기/펼치기 상태
  const [isExpanded, setIsExpanded] = useState(true);

  // 검색어 로컬 상태 (디바운스용)
  const [localSearch, setLocalSearch] = useState(search);

  // 검색어 동기화
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // ============================================================
  // 핸들러
  // ============================================================

  /**
   * 소스 토글
   */
  const handleSourceToggle = useCallback(
    (source: LogSource) => {
      if (sources.includes(source)) {
        // 제거 (최소 1개는 유지하지 않음 - 전체 선택 해제 가능)
        onSourcesChange(sources.filter((s) => s !== source));
      } else {
        // 추가
        onSourcesChange([...sources, source]);
      }
    },
    [sources, onSourcesChange]
  );

  /**
   * 레벨 토글
   */
  const handleLevelToggle = useCallback(
    (level: LogLevel) => {
      if (levels.includes(level)) {
        // 제거
        onLevelsChange(levels.filter((l) => l !== level));
      } else {
        // 추가
        onLevelsChange([...levels, level]);
      }
    },
    [levels, onLevelsChange]
  );

  /**
   * 모든 필터 리셋
   */
  const handleReset = useCallback(() => {
    // 외부 콜백 호출 (있으면)
    if (onReset) {
      onReset();
      setLocalSearch('');
    } else {
      // 기본 동작: 모든 소스/레벨 선택, 검색어 클리어
      onSourcesChange([]);
      onLevelsChange([]);
      onSearchChange('');
      setLocalSearch('');
    }
  }, [onReset, onSourcesChange, onLevelsChange, onSearchChange]);

  /**
   * 검색어 클리어
   */
  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    onSearchChange('');
  }, [onSearchChange]);

  // 활성 필터 개수
  const activeFilterCount =
    (sources.length < ALL_SOURCES.length ? 1 : 0) +
    (levels.length < ALL_LEVELS.length ? 1 : 0) +
    (search.length > 0 ? 1 : 0);

  // ============================================================
  // 렌더링
  // ============================================================

  // 필터 콘텐츠 (카드 내부 또는 인라인 모드에서 공유)
  const filterContent = (
    <>
      {/* 헤더 (컴팩트 모드에서는 숨김) */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">필터</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                초기화
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 sm:hidden"
              >
                {isExpanded ? '접기' : '펼치기'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 필터 본문 */}
      <div
        className={cn(
          compact ? 'flex flex-wrap items-center gap-3' : 'space-y-4',
          'transition-all duration-200',
          !isExpanded && !compact && 'hidden sm:block'
        )}
      >
        {/* 검색 입력 */}
        <div className={cn('relative', compact ? 'w-48' : 'w-full')}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="로그 검색..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className={cn(
              'w-full rounded-md border border-input bg-background px-9 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              compact && 'py-1.5'
            )}
          />
          {localSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 소스 필터 */}
        <div className={compact ? 'flex items-center gap-1' : ''}>
          {!compact && (
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              소스
            </label>
          )}
          <div className="flex flex-wrap gap-1">
            {ALL_SOURCES.map((source) => {
              const isSelected = sources.length === 0 || sources.includes(source);
              return (
                <Button
                  key={source}
                  variant={isSelected && sources.length > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSourceToggle(source)}
                  className={cn(
                    compact ? 'h-6 px-2 text-xs' : 'h-7 text-xs',
                    sources.length > 0 && !isSelected && 'opacity-50'
                  )}
                >
                  {SOURCE_LABELS[source]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 레벨 필터 */}
        <div className={compact ? 'flex items-center gap-1' : ''}>
          {!compact && (
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              레벨
            </label>
          )}
          <div className="flex flex-wrap gap-1">
            {ALL_LEVELS.map((level) => {
              const isSelected = levels.length === 0 || levels.includes(level);
              return (
                <Badge
                  key={level}
                  variant={isSelected && levels.length > 0 ? LEVEL_BADGE_VARIANTS[level] : 'outline'}
                  className={cn(
                    'cursor-pointer select-none transition-all',
                    compact && 'text-xs px-1.5 py-0',
                    isSelected && levels.length > 0
                      ? LOG_LEVEL_COLORS[level]
                      : 'opacity-40 hover:opacity-60'
                  )}
                  onClick={() => handleLevelToggle(level)}
                >
                  {LEVEL_LABELS[level]}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 컴팩트 모드: 초기화 버튼 */}
        {compact && activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            초기화
          </Button>
        )}
      </div>
    </>
  );

  // 컴팩트 모드: 카드 없이 렌더링
  if (compact) {
    return <div className={cn('flex flex-wrap gap-3', className)}>{filterContent}</div>;
  }

  // 일반 모드: 카드 래핑
  return (
    <Card className={cn('transition-all duration-200', className)}>
      <CardContent className="p-4">{filterContent}</CardContent>
    </Card>
  );
});

export default LogFilter;
