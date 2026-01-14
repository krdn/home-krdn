'use client';

import { memo, useMemo } from 'react';
import { Cpu, MemoryStick, HardDrive, Clock, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

/**
 * 시스템 메트릭 대시보드 스탯 카드
 * CPU, Memory, Disk, Uptime을 한눈에 보여줍니다.
 *
 * 최적화:
 * - 개별 StatCard를 memo()로 감싸서 해당 값 변경 시에만 리렌더링
 * - useMemo로 값 포맷팅 결과 캐싱
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

/**
 * StatCard Props
 */
interface StatCardProps {
  /** 카드 제목 */
  title: string;
  /** 주요 값 (포맷팅된 문자열) */
  value: string;
  /** 부가 정보 */
  subtitle: string;
  /** 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 아이콘 배경 색상 클래스 */
  iconBgColor: string;
  /** 아이콘 색상 클래스 */
  iconColor: string;
  /** 진행률 바 너비 (0-100) */
  progressWidth: number;
  /** 진행률 바 색상 클래스 */
  progressColor: string;
}

/**
 * 개별 스탯 카드 컴포넌트
 * memo()로 감싸서 props 변경 시에만 리렌더링됩니다.
 */
const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  progressWidth,
  progressColor,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBgColor}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
});

export function DashboardStats() {
  const { data, loading, error } = useSystemMetrics(5000);

  // CPU 카드 데이터 메모이제이션
  const cpuCardData = useMemo(() => {
    if (!data) return null;
    return {
      value: `${data.cpu.usage.toFixed(1)}%`,
      subtitle: `${data.cpu.cores} cores • Load: ${data.cpu.loadAvg[0]}`,
      progressWidth: Math.min(data.cpu.usage, 100),
      progressColor: getProgressColor(data.cpu.usage),
    };
  }, [data?.cpu.usage, data?.cpu.cores, data?.cpu.loadAvg]);

  // Memory 카드 데이터 메모이제이션
  const memoryCardData = useMemo(() => {
    if (!data) return null;
    return {
      value: `${data.memory.usage.toFixed(1)}%`,
      subtitle: `${data.memory.used} / ${data.memory.total}`,
      progressWidth: Math.min(data.memory.usage, 100),
      progressColor: getProgressColor(data.memory.usage),
    };
  }, [data?.memory.usage, data?.memory.used, data?.memory.total]);

  // Disk 카드 데이터 메모이제이션
  const diskCardData = useMemo(() => {
    if (!data) return null;
    return {
      value: `${data.disk.usage.toFixed(1)}%`,
      subtitle: `${data.disk.used} / ${data.disk.total}`,
      progressWidth: Math.min(data.disk.usage, 100),
      progressColor: getProgressColor(data.disk.usage),
    };
  }, [data?.disk.usage, data?.disk.used, data?.disk.total]);

  // Uptime 카드 데이터 메모이제이션
  const uptimeCardData = useMemo(() => {
    if (!data) return null;
    return {
      value: data.uptime,
      subtitle: data.hostname,
    };
  }, [data?.uptime, data?.hostname]);

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
      <StatCard
        title="CPU Usage"
        value={cpuCardData!.value}
        subtitle={cpuCardData!.subtitle}
        icon={Cpu}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        progressWidth={cpuCardData!.progressWidth}
        progressColor={cpuCardData!.progressColor}
      />

      {/* Memory Card */}
      <StatCard
        title="Memory"
        value={memoryCardData!.value}
        subtitle={memoryCardData!.subtitle}
        icon={MemoryStick}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        progressWidth={memoryCardData!.progressWidth}
        progressColor={memoryCardData!.progressColor}
      />

      {/* Disk Card */}
      <StatCard
        title="Disk"
        value={diskCardData!.value}
        subtitle={diskCardData!.subtitle}
        icon={HardDrive}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        progressWidth={diskCardData!.progressWidth}
        progressColor={diskCardData!.progressColor}
      />

      {/* Uptime Card */}
      <StatCard
        title="Uptime"
        value={uptimeCardData!.value}
        subtitle={uptimeCardData!.subtitle}
        icon={Clock}
        iconBgColor="bg-success/10"
        iconColor="text-success"
        progressWidth={100}
        progressColor="bg-success"
      />
    </div>
  );
}
