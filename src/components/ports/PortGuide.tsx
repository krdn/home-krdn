'use client';

/**
 * PortGuide 컴포넌트
 *
 * 카테고리별 포트 사용 현황과 신규 포트 추천을 제공합니다.
 * Progress Bar로 사용량을 시각화하고, 추천 폼을 통해 빈 포트를 안내합니다.
 *
 * Phase 43: Port Scanner & Guide
 */

import { useState } from 'react';
import {
  RefreshCw,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HelpButton } from '@/components/help';
import { usePortRecommendation } from '@/hooks/usePorts';
import {
  PORT_CATEGORIES,
  PORT_ENVIRONMENTS,
  PORT_CATEGORY_RANGES,
  type PortCategory,
  type PortEnvironment,
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
  development: '개발',
  staging: '스테이징',
  production: '프로덕션',
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 사용률에 따른 Progress Bar 색상을 반환합니다.
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-red-500';
  if (percentage >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * 사용률에 따른 상태 텍스트를 반환합니다.
 */
function getUsageStatus(percentage: number): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' } {
  if (percentage >= 80) return { text: '포화', variant: 'destructive' };
  if (percentage >= 60) return { text: '보통', variant: 'warning' };
  return { text: '여유', variant: 'default' };
}

// ============================================================
// 컴포넌트
// ============================================================

export function PortGuide() {
  // 추천 폼 상태
  const [selectedCategory, setSelectedCategory] = useState<PortCategory | ''>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<PortEnvironment | ''>('');

  // 포트 추천 훅 (선택된 카테고리/환경에 따라)
  const {
    recommendation,
    usage,
    ranges,
    isLoading,
    error,
    refetch,
  } = usePortRecommendation(
    selectedCategory || undefined,
    selectedEnvironment || undefined
  );

  // 로딩 상태
  if (isLoading && !usage) {
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
          <p className="mb-2 font-medium">포트 가이드를 불러오지 못했습니다</p>
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Lightbulb className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">포트 가이드</h2>
            <HelpButton helpId="widget-port-guide" size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            카테고리별 포트 사용 현황과 신규 포트 추천
          </p>
        </div>
      </div>

      {/* 카테고리별 사용 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">카테고리별 포트 사용 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PORT_CATEGORIES.map((category) => {
            const range = ranges?.[category] ?? PORT_CATEGORY_RANGES[category];
            const categoryUsage = usage?.[category] ?? { used: 0, total: range.end - range.start + 1, available: range.end - range.start + 1 };
            const percentage = Math.round((categoryUsage.used / categoryUsage.total) * 100);
            const status = getUsageStatus(percentage);

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{categoryLabels[category]}</span>
                    <Badge variant="outline" className="text-xs">
                      {range.start}-{range.end}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {categoryUsage.used}/{categoryUsage.total}
                    </span>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{range.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 포트 추천 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-amber-500" />
            신규 포트 추천
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
            <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              새로운 프로젝트를 시작할 때 카테고리와 환경을 선택하면 사용 가능한
              포트를 추천해 드립니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* 카테고리 선택 */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PortCategory | '')}
                className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">카테고리 선택</option>
                {PORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* 환경 선택 */}
            <div className="relative">
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as PortEnvironment | '')}
                className="appearance-none rounded-md border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">환경 선택</option>
                {PORT_ENVIRONMENTS.map((env) => (
                  <option key={env} value={env}>
                    {environmentLabels[env]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* 추천받기 버튼 */}
            <Button
              onClick={() => refetch()}
              variant="default"
              size="sm"
              disabled={!selectedCategory || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              추천받기
            </Button>
          </div>

          {/* 추천 결과 */}
          {recommendation && selectedCategory && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">추천 포트</p>
                  <p className="text-3xl font-bold text-primary">
                    {recommendation.port}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">범위</p>
                  <p className="text-sm">
                    {recommendation.rangeInfo.start}-{recommendation.rangeInfo.end}
                  </p>
                </div>
              </div>

              {recommendation.alternativePorts.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">대안 포트</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.alternativePorts.slice(0, 5).map((port) => (
                      <Badge key={port} variant="outline">
                        {port}
                      </Badge>
                    ))}
                    {recommendation.alternativePorts.length > 5 && (
                      <Badge variant="secondary">
                        +{recommendation.alternativePorts.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                {recommendation.rangeInfo.description}
              </p>
            </div>
          )}

          {/* 선택 안내 */}
          {!selectedCategory && (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                카테고리를 선택하면 추천 포트가 표시됩니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
