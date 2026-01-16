'use client';

/**
 * K8sPodList 컴포넌트
 *
 * Kubernetes Pod 목록 표시
 *
 * Phase 40: K8s Dashboard
 */

import { useMemo } from 'react';
import { Box, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useK8sPods } from '@/hooks/useKubernetes';
import type { K8sPod } from '@/types/kubernetes';

interface K8sPodListProps {
  clusterId: string;
  namespace?: string;
  refreshInterval?: number;
}

/**
 * Pod 상태에 따른 아이콘 및 색상
 */
function getPodStatusInfo(status: string) {
  switch (status.toLowerCase()) {
    case 'running':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10' };
    case 'pending':
      return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10' };
    case 'succeeded':
      return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-500/10' };
    case 'failed':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10' };
    default:
      return { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

/**
 * Pod 아이템 컴포넌트
 */
function PodItem({ pod }: { pod: K8sPod }) {
  const statusInfo = getPodStatusInfo(pod.status);
  const StatusIcon = statusInfo.icon;

  // 컨테이너 상태 요약
  const containerSummary = useMemo(() => {
    const ready = pod.containers.filter((c) => c.ready).length;
    const total = pod.containers.length;
    const restarts = pod.containers.reduce((sum, c) => sum + c.restartCount, 0);
    return { ready, total, restarts };
  }, [pod.containers]);

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {/* 상태 아이콘 */}
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusInfo.bg}`}>
        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
      </div>

      {/* Pod 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{pod.name}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{pod.namespace}</span>
          {pod.nodeName && <span className="hidden sm:inline">Node: {pod.nodeName}</span>}
          {pod.podIP && <span className="hidden md:inline">IP: {pod.podIP}</span>}
        </div>
      </div>

      {/* 컨테이너 상태 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium">
            {containerSummary.ready}/{containerSummary.total}
          </div>
          <div className="text-xs text-muted-foreground">Ready</div>
        </div>
        {containerSummary.restarts > 0 && (
          <div className="text-center">
            <div className="font-medium text-yellow-600">{containerSummary.restarts}</div>
            <div className="text-xs text-muted-foreground">Restarts</div>
          </div>
        )}
      </div>

      {/* 상태 뱃지 */}
      <div className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
        {pod.status}
      </div>
    </div>
  );
}

/**
 * K8sPodList 컴포넌트
 */
export function K8sPodList({ clusterId, namespace, refreshInterval = 30000 }: K8sPodListProps) {
  const { pods, isLoading, errorMessage } = useK8sPods(
    clusterId,
    namespace ? { namespace } : undefined,
    { refreshInterval }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Pod 목록 로딩 중...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (pods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <Box className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          {namespace ? `${namespace} 네임스페이스에 Pod가 없습니다.` : 'Pod가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>총 {pods.length}개 Pod</span>
      </div>
      {pods.map((pod) => (
        <PodItem key={`${pod.namespace}/${pod.name}`} pod={pod} />
      ))}
    </div>
  );
}
