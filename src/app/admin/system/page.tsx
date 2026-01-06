"use client";

import { Cpu, MemoryStick, HardDrive, Clock, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

function ProgressBar({
  value,
  max = 100,
  color = "bg-primary",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function AdminSystemPage() {
  const systemStats = {
    cpu: { usage: 45, cores: 8 },
    memory: { used: 8.2, total: 16, percentage: 51 },
    disk: { used: 180, total: 500, percentage: 36 },
    uptime: "12d 5h 32m",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">System</h1>
        <p className="mt-1 text-muted-foreground">
          시스템 리소스 모니터링
        </p>
      </div>

      {/* System Info */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Ubuntu Linux</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Uptime: <strong>{systemStats.uptime}</strong>
          </span>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* CPU */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold">{systemStats.cpu.usage}</span>
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <ProgressBar
              value={systemStats.cpu.usage}
              color={
                systemStats.cpu.usage > 80
                  ? "bg-red-500"
                  : systemStats.cpu.usage > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            />
            <p className="text-center text-sm text-muted-foreground">
              {systemStats.cpu.cores} cores
            </p>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="h-5 w-5" />
              Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold">
                {systemStats.memory.percentage}
              </span>
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <ProgressBar
              value={systemStats.memory.percentage}
              color={
                systemStats.memory.percentage > 80
                  ? "bg-red-500"
                  : systemStats.memory.percentage > 60
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            />
            <p className="text-center text-sm text-muted-foreground">
              {systemStats.memory.used} GB / {systemStats.memory.total} GB
            </p>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Disk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold">
                {systemStats.disk.percentage}
              </span>
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <ProgressBar
              value={systemStats.disk.percentage}
              color={
                systemStats.disk.percentage > 80
                  ? "bg-red-500"
                  : systemStats.disk.percentage > 60
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }
            />
            <p className="text-center text-sm text-muted-foreground">
              {systemStats.disk.used} GB / {systemStats.disk.total} GB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> 실시간 시스템 메트릭은 백엔드 API 연동 후
            활성화됩니다. 현재는 샘플 데이터가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
