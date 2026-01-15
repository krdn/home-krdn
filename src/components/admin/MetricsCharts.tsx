'use client';

import { useState, useMemo, memo } from 'react';
import { useMetricsHistory, ChartDataPoint } from '@/hooks/useMetricsHistory';
import { MetricsLineChart, MetricDataPoint } from '@/components/charts/MetricsLineChart';
import { NetworkAreaChart } from '@/components/charts/NetworkAreaChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, RefreshCw } from 'lucide-react';

/**
 * 시간 범위 옵션 타입
 */
interface TimeRangeOption {
  label: string;
  minutes: number;
}

/**
 * 사용 가능한 시간 범위 옵션
 */
const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '15분', minutes: 15 },
  { label: '30분', minutes: 30 },
  { label: '1시간', minutes: 60 },
];

/**
 * ChartDataPoint를 MetricDataPoint로 변환
 * @param data 원본 데이터
 * @param key 추출할 키
 * @returns 변환된 데이터
 */
function toMetricData(
  data: ChartDataPoint[],
  key: 'cpu' | 'memory' | 'disk'
): MetricDataPoint[] {
  return data.map((point) => ({
    time: point.time,
    timestamp: point.timestamp,
    value: point[key],
  }));
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse">
      <div className="mb-2 h-4 w-24 rounded bg-muted" />
      <div className="h-52 rounded-lg bg-muted" />
    </div>
  );
}

/**
 * 에러 표시 컴포넌트
 */
function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

/**
 * 데이터 없음 표시 컴포넌트
 */
function NoData() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg border border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">
        데이터가 수집되고 있습니다. 잠시 기다려 주세요...
      </p>
    </div>
  );
}

/**
 * 메트릭 차트 대시보드 섹션 컴포넌트
 * CPU, Memory, Disk, Network 차트를 그리드로 표시합니다.
 */
export function MetricsCharts() {
  const [minutes, setMinutes] = useState(30);
  const { chartData, loading, error, refetch } = useMetricsHistory(minutes);

  // 데이터 변환 - useMemo로 캐싱하여 차트 리렌더링 최소화
  const cpuData = useMemo(() => toMetricData(chartData, 'cpu'), [chartData]);
  const memoryData = useMemo(() => toMetricData(chartData, 'memory'), [chartData]);
  const diskData = useMemo(() => toMetricData(chartData, 'disk'), [chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Metrics History
        </CardTitle>

        {/* 컨트롤 영역 */}
        <div className="flex items-center gap-2">
          {/* 시간 범위 선택 */}
          <div className="flex rounded-lg border bg-muted/50 p-0.5">
            {TIME_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.minutes}
                variant={minutes === option.minutes ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setMinutes(option.minutes)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* 새로고침 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">새로고침</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* 에러 상태 */}
        {error && <ChartError message={error} />}

        {/* 로딩 상태 */}
        {loading && !chartData.length && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !error && chartData.length === 0 && <NoData />}

        {/* 차트 그리드 */}
        {!error && chartData.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* CPU 차트 */}
            <MetricsLineChart
              data={cpuData}
              title="CPU Usage"
              color="hsl(var(--warning))"
              unit="%"
            />

            {/* Memory 차트 */}
            <MetricsLineChart
              data={memoryData}
              title="Memory Usage"
              color="hsl(var(--info))"
              unit="%"
            />

            {/* Disk 차트 */}
            <MetricsLineChart
              data={diskData}
              title="Disk Usage"
              color="hsl(var(--destructive))"
              unit="%"
            />

            {/* Network 차트 */}
            <NetworkAreaChart data={chartData} title="Network I/O" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
