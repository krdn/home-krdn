'use client';

/**
 * K8sDeploymentList 컴포넌트
 *
 * Kubernetes Deployment 목록 표시
 *
 * Phase 40: K8s Dashboard
 */

import { Layers, Loader2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useK8sDeployments } from '@/hooks/useKubernetes';
import type { K8sDeployment } from '@/types/kubernetes';

interface K8sDeploymentListProps {
  clusterId: string;
  namespace?: string;
  refreshInterval?: number;
}

/**
 * Deployment 상태에 따른 정보
 */
function getDeploymentStatusInfo(deployment: K8sDeployment) {
  const { replicas, readyReplicas, availableReplicas } = deployment;

  if (readyReplicas === replicas && availableReplicas === replicas) {
    return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10', status: 'Healthy' };
  }

  if (readyReplicas > 0) {
    return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/10', status: 'Progressing' };
  }

  return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10', status: 'Unhealthy' };
}

/**
 * Deployment 아이템 컴포넌트
 */
function DeploymentItem({ deployment }: { deployment: K8sDeployment }) {
  const statusInfo = getDeploymentStatusInfo(deployment);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {/* 상태 아이콘 */}
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusInfo.bg}`}>
        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
      </div>

      {/* Deployment 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{deployment.name}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{deployment.namespace}</span>
          <span className="hidden sm:inline">Strategy: {deployment.strategy}</span>
        </div>
      </div>

      {/* 레플리카 상태 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="font-medium">
            {deployment.readyReplicas}/{deployment.replicas}
          </div>
          <div className="text-xs text-muted-foreground">Ready</div>
        </div>
        <div className="hidden sm:block text-center">
          <div className="font-medium">{deployment.availableReplicas}</div>
          <div className="text-xs text-muted-foreground">Available</div>
        </div>
        <div className="hidden md:block text-center">
          <div className="font-medium">{deployment.updatedReplicas}</div>
          <div className="text-xs text-muted-foreground">Updated</div>
        </div>
      </div>

      {/* 상태 뱃지 */}
      <div className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
        {statusInfo.status}
      </div>
    </div>
  );
}

/**
 * K8sDeploymentList 컴포넌트
 */
export function K8sDeploymentList({ clusterId, namespace, refreshInterval = 30000 }: K8sDeploymentListProps) {
  const { deployments, isLoading, errorMessage } = useK8sDeployments(
    clusterId,
    namespace ? { namespace } : undefined,
    { refreshInterval }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Deployment 목록 로딩 중...</span>
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

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <Layers className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          {namespace ? `${namespace} 네임스페이스에 Deployment가 없습니다.` : 'Deployment가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>총 {deployments.length}개 Deployment</span>
      </div>
      {deployments.map((deployment) => (
        <DeploymentItem key={`${deployment.namespace}/${deployment.name}`} deployment={deployment} />
      ))}
    </div>
  );
}
