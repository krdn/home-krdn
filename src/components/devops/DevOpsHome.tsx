'use client';

/**
 * DevOpsHome 대시보드 컴포넌트
 *
 * DevOps 도구들의 상태 요약을 한눈에 보여주는 대시보드
 * GitHub, Kubernetes, Ports, Log Alerts 상태 카드 표시
 *
 * Phase 42: DevOps Home
 */

import Link from 'next/link';
import {
  Github,
  Container,
  Network,
  Bell,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  Layers,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDevOpsSummary } from '@/hooks/useDevOpsSummary';
import type { DevOpsSummary } from '@/types/devops';

interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  status: 'connected' | 'active' | 'inactive' | 'warning';
  children: React.ReactNode;
}

/**
 * 상태 카드 컴포넌트
 */
function StatusCard({ title, icon, href, status, children }: StatusCardProps) {
  const statusConfig = {
    connected: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 },
    active: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 },
    inactive: { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: XCircle },
    warning: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
              {icon}
            </div>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${config.color}`} />
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 통계 아이템 컴포넌트
 */
function StatItem({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * GitHub 상태 카드
 */
function GitHubCard({ github }: { github: DevOpsSummary['github'] }) {
  return (
    <StatusCard
      title="GitHub"
      icon={<Github className="h-5 w-5 text-gray-900 dark:text-white" />}
      href="/admin/github"
      status={github.connected ? 'connected' : 'inactive'}
    >
      <div className="space-y-2">
        {github.connected ? (
          <>
            <StatItem label="사용자" value={github.username || '-'} />
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✓ 연동됨
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            GitHub 토큰을 등록하여 CI/CD를 연동하세요.
          </div>
        )}
      </div>
    </StatusCard>
  );
}

/**
 * Kubernetes 상태 카드
 */
function KubernetesCard({ kubernetes }: { kubernetes: DevOpsSummary['kubernetes'] }) {
  const hasActiveClusters = kubernetes.activeClusterCount > 0;

  return (
    <StatusCard
      title="Kubernetes"
      icon={<Container className="h-5 w-5 text-blue-500" />}
      href="/admin/kubernetes"
      status={hasActiveClusters ? 'active' : kubernetes.clusterCount > 0 ? 'warning' : 'inactive'}
    >
      <div className="space-y-2">
        <StatItem
          label="클러스터"
          value={`${kubernetes.activeClusterCount}/${kubernetes.clusterCount}`}
          icon={<Layers className="h-3.5 w-3.5" />}
        />
        {kubernetes.clusters && kubernetes.clusters.length > 0 ? (
          <div className="mt-2 space-y-1">
            {kubernetes.clusters.slice(0, 3).map((cluster) => (
              <div
                key={cluster.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate">{cluster.name}</span>
                <span
                  className={
                    cluster.isActive
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }
                >
                  {cluster.isActive ? '활성' : '비활성'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            클러스터를 등록하세요.
          </div>
        )}
      </div>
    </StatusCard>
  );
}

/**
 * Ports 상태 카드
 */
function PortsCard({ ports }: { ports: DevOpsSummary['ports'] }) {
  return (
    <StatusCard
      title="Port Registry"
      icon={<Network className="h-5 w-5 text-purple-500" />}
      href="/admin/ports"
      status={ports.activePorts > 0 ? 'active' : ports.totalPorts > 0 ? 'warning' : 'inactive'}
    >
      <div className="space-y-2">
        <StatItem
          label="등록 포트"
          value={`${ports.activePorts}/${ports.totalPorts}`}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        {ports.recentPorts && ports.recentPorts.length > 0 ? (
          <div className="mt-2 space-y-1">
            {ports.recentPorts.slice(0, 3).map((port) => (
              <div
                key={port.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate">{port.projectName}</span>
                <span className="text-muted-foreground">:{port.port}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            개발 포트를 등록하세요.
          </div>
        )}
      </div>
    </StatusCard>
  );
}

/**
 * Log Alerts 상태 카드
 */
function LogAlertsCard({ logAlerts }: { logAlerts: DevOpsSummary['logAlerts'] }) {
  return (
    <StatusCard
      title="Log Alerts"
      icon={<Bell className="h-5 w-5 text-orange-500" />}
      href="/admin/log-alerts"
      status={logAlerts.activeRules > 0 ? 'active' : logAlerts.totalRules > 0 ? 'warning' : 'inactive'}
    >
      <div className="space-y-2">
        <StatItem
          label="활성 규칙"
          value={`${logAlerts.activeRules}/${logAlerts.totalRules}`}
        />
        <StatItem
          label="총 트리거 횟수"
          value={logAlerts.recentTriggers}
        />
        {logAlerts.totalRules === 0 && (
          <div className="text-sm text-muted-foreground">
            로그 알림 규칙을 생성하세요.
          </div>
        )}
      </div>
    </StatusCard>
  );
}

/**
 * DevOpsHome 대시보드 컴포넌트
 */
export function DevOpsHome() {
  const { summary, isLoading, errorMessage, refetch } = useDevOpsSummary({
    refreshInterval: 60000, // 1분마다 자동 새로고침
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">DevOps 상태 로딩 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (errorMessage) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  // 데이터 없음
  if (!summary) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">DevOps 상태를 가져올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DevOps Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            개발 도구 상태 요약
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GitHubCard github={summary.github} />
        <KubernetesCard kubernetes={summary.kubernetes} />
        <PortsCard ports={summary.ports} />
        <LogAlertsCard logAlerts={summary.logAlerts} />
      </div>

      {/* 마지막 업데이트 */}
      <div className="text-right text-xs text-muted-foreground">
        마지막 업데이트: {new Date(summary.generatedAt).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
