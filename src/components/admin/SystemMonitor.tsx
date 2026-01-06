'use client';

import { Cpu, MemoryStick, HardDrive, Server, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

function ProgressBar({
  value,
  color = 'primary',
}: {
  value: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const getColor = (val: number) => {
    if (val >= 90) return colorClasses.danger;
    if (val >= 70) return colorClasses.warning;
    if (val >= 50) return colorClasses.primary;
    return colorClasses.success;
  };

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all duration-500 ${getColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function SystemMonitor() {
  const { data, loading, error, refetch } = useSystemMetrics(5000);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <p className="mb-4 text-muted-foreground">
            Failed to load system metrics
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* CPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">CPU</CardTitle>
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold">{data.cpu.usage}%</span>
              <span className="text-sm text-muted-foreground">
                {data.cpu.cores} cores
              </span>
            </div>
            <ProgressBar value={data.cpu.usage} />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Load Average</span>
                <span>
                  {data.cpu.loadAvg[0]} / {data.cpu.loadAvg[1]} /{' '}
                  {data.cpu.loadAvg[2]}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {data.cpu.model}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Memory</CardTitle>
            <MemoryStick className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold">{data.memory.usage}%</span>
              <span className="text-sm text-muted-foreground">
                {data.memory.total}
              </span>
            </div>
            <ProgressBar value={data.memory.usage} />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used</span>
                <span>{data.memory.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free</span>
                <span>{data.memory.free}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Disk</CardTitle>
            <HardDrive className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold">{data.disk.usage}%</span>
              <span className="text-sm text-muted-foreground">
                {data.disk.total}
              </span>
            </div>
            <ProgressBar value={data.disk.usage} />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used</span>
                <span>{data.disk.used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free</span>
                <span>{data.disk.free}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Information
          </CardTitle>
          <Button onClick={refetch} variant="ghost" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Hostname</span>
                <span className="font-medium">{data.hostname}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{data.platform}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">{data.uptime}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">CPU Cores</span>
                <span className="font-medium">{data.cpu.cores}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
