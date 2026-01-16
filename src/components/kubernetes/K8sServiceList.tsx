'use client';

/**
 * K8sServiceList 컴포넌트
 *
 * Kubernetes Service 목록 표시
 *
 * Phase 40: K8s Dashboard
 */

import { Globe, Loader2, AlertCircle, Network, ExternalLink } from 'lucide-react';
import { useK8sServices } from '@/hooks/useKubernetes';
import type { K8sService } from '@/types/kubernetes';

interface K8sServiceListProps {
  clusterId: string;
  namespace?: string;
  refreshInterval?: number;
}

/**
 * Service 타입에 따른 색상
 */
function getServiceTypeInfo(type: string) {
  switch (type) {
    case 'LoadBalancer':
      return { color: 'text-green-600', bg: 'bg-green-500/10' };
    case 'NodePort':
      return { color: 'text-blue-600', bg: 'bg-blue-500/10' };
    case 'ClusterIP':
      return { color: 'text-purple-600', bg: 'bg-purple-500/10' };
    case 'ExternalName':
      return { color: 'text-orange-600', bg: 'bg-orange-500/10' };
    default:
      return { color: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

/**
 * Service 아이템 컴포넌트
 */
function ServiceItem({ service }: { service: K8sService }) {
  const typeInfo = getServiceTypeInfo(service.type);

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {/* 아이콘 */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Network className="h-5 w-5 text-primary" />
      </div>

      {/* Service 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{service.name}</span>
          {service.externalIP && (
            <a
              href={`http://${service.externalIP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{service.namespace}</span>
          {service.clusterIP && <span className="hidden sm:inline">ClusterIP: {service.clusterIP}</span>}
        </div>
      </div>

      {/* 포트 정보 */}
      <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
        {service.ports.slice(0, 3).map((port, idx) => (
          <span
            key={idx}
            className="rounded bg-muted px-2 py-0.5 text-xs font-mono"
          >
            {port.port}
            {port.nodePort ? `:${port.nodePort}` : ''}
            /{port.protocol}
          </span>
        ))}
        {service.ports.length > 3 && (
          <span className="text-xs text-muted-foreground">+{service.ports.length - 3}</span>
        )}
      </div>

      {/* 타입 뱃지 */}
      <div className={`rounded-full px-2 py-1 text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
        {service.type}
      </div>
    </div>
  );
}

/**
 * K8sServiceList 컴포넌트
 */
export function K8sServiceList({ clusterId, namespace, refreshInterval = 60000 }: K8sServiceListProps) {
  const { services, isLoading, errorMessage } = useK8sServices(
    clusterId,
    namespace ? { namespace } : undefined,
    { refreshInterval }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Service 목록 로딩 중...</span>
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

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <Globe className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          {namespace ? `${namespace} 네임스페이스에 Service가 없습니다.` : 'Service가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>총 {services.length}개 Service</span>
      </div>
      {services.map((service) => (
        <ServiceItem key={`${service.namespace}/${service.name}`} service={service} />
      ))}
    </div>
  );
}
