import { SystemMonitor } from '@/components/admin/SystemMonitor';

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">System</h1>
        <p className="mt-1 text-muted-foreground">
          시스템 리소스 모니터링 (5초마다 자동 갱신)
        </p>
      </div>

      {/* System Monitor - Real-time */}
      <SystemMonitor />
    </div>
  );
}
