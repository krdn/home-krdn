'use client';

import { Cpu, MemoryStick, HardDrive, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

/**
 * 시스템 메트릭 대시보드 스탯 카드
 * CPU, Memory, Disk, Uptime을 한눈에 보여줍니다.
 */

// 진행률 바 색상 결정 (사용률에 따라)
function getProgressColor(usage: number): string {
  if (usage >= 90) return 'bg-destructive';
  if (usage >= 70) return 'bg-warning';
  return 'bg-primary';
}

// 로딩 상태 스켈레톤 카드
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-12 w-12" circle />
        </div>
        <Skeleton className="mt-4 h-2 w-full" />
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const { data, loading, error } = useSystemMetrics(5000);

  // 로딩 상태: Skeleton 컴포넌트 사용
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">
              시스템 메트릭을 불러오지 못했습니다: {error || 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* CPU Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
              <p className="text-2xl font-bold">{data.cpu.usage.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.cpu.cores} cores • Load: {data.cpu.loadAvg[0]}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(data.cpu.usage)}`}
              style={{ width: `${Math.min(data.cpu.usage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Memory Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Memory</p>
              <p className="text-2xl font-bold">{data.memory.usage.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.memory.used} / {data.memory.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MemoryStick className="h-6 w-6 text-primary" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(data.memory.usage)}`}
              style={{ width: `${Math.min(data.memory.usage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Disk Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Disk</p>
              <p className="text-2xl font-bold">{data.disk.usage.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.disk.used} / {data.disk.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HardDrive className="h-6 w-6 text-primary" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(data.disk.usage)}`}
              style={{ width: `${Math.min(data.disk.usage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Uptime Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">{data.uptime}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.hostname}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Clock className="h-6 w-6 text-success" />
            </div>
          </div>
          {/* Uptime indicator - always green (system is running) */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-2 w-full rounded-full bg-success transition-all duration-300" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
