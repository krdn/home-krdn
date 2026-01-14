'use client';

import { Box, CircleCheck, CircleX, Container } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useContainers } from '@/hooks/useContainers';

/**
 * 컨테이너 상태 카드
 * Docker 컨테이너의 실행/정지/전체 상태를 시각적으로 표시합니다.
 */

// 로딩 상태 스켈레톤
function ContainerStatsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" circle />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="mx-auto h-8 w-12" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContainerStats() {
  const { summary, loading } = useContainers(10000);

  // 로딩 상태: Skeleton 컴포넌트 사용
  if (loading) {
    return <ContainerStatsSkeleton />;
  }

  const running = summary?.running ?? 0;
  const stopped = summary?.stopped ?? 0;
  const total = summary?.total ?? 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          Containers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Running */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <CircleCheck className="h-4 w-4 text-success" />
              <p className="text-2xl font-bold tabular-nums text-success transition-all duration-300">
                {running}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Running</p>
          </div>

          {/* Stopped */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <CircleX className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold tabular-nums text-muted-foreground transition-all duration-300">
                {stopped}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Stopped</p>
          </div>

          {/* Total */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Container className="h-4 w-4 text-foreground" />
              <p className="text-2xl font-bold tabular-nums transition-all duration-300">
                {total}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Visual indicator bar */}
        {total > 0 && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-success transition-all duration-300"
              style={{ width: `${(running / total) * 100}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
