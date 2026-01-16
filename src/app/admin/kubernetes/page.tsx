'use client';

/**
 * Kubernetes Admin 페이지
 *
 * Kubernetes 클러스터 관리 및 리소스 대시보드 페이지
 *
 * Phase 40: K8s Dashboard
 * Phase 41: Service Mesh Overview
 *
 * - 클러스터 등록/관리
 * - 네임스페이스 선택
 * - Pod/Service/Deployment 목록 조회
 * - Service Topology 시각화
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Server, Loader2, ArrowLeft, Layers, Box, Globe, FolderOpen, Network } from 'lucide-react';
import { AdminOnly } from '@/components/admin/RoleGuard';
import { Button } from '@/components/ui/Button';
import { useK8sNamespaces } from '@/hooks/useKubernetes';
import type { KubernetesClusterDto } from '@/types/kubernetes';

// Dynamic Import: 컴포넌트 지연 로딩
const K8sClusterSetup = dynamic(
  () => import('@/components/kubernetes/K8sClusterSetup').then((mod) => mod.K8sClusterSetup),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const K8sPodList = dynamic(
  () => import('@/components/kubernetes/K8sPodList').then((mod) => mod.K8sPodList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const K8sServiceList = dynamic(
  () => import('@/components/kubernetes/K8sServiceList').then((mod) => mod.K8sServiceList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const K8sDeploymentList = dynamic(
  () => import('@/components/kubernetes/K8sDeploymentList').then((mod) => mod.K8sDeploymentList),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const ServiceTopology = dynamic(
  () => import('@/components/kubernetes/ServiceTopology').then((mod) => mod.ServiceTopology),
  {
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-card p-6 h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

// 탭 타입
type ResourceTab = 'topology' | 'pods' | 'services' | 'deployments';

/**
 * 네임스페이스 셀렉터 컴포넌트
 */
function NamespaceSelector({
  clusterId,
  selectedNamespace,
  onSelect,
}: {
  clusterId: string;
  selectedNamespace: string | null;
  onSelect: (ns: string | null) => void;
}) {
  const { namespaces, isLoading } = useK8sNamespaces(clusterId);

  return (
    <div className="flex items-center gap-2">
      <FolderOpen className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedNamespace ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        disabled={isLoading}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">모든 Namespace</option>
        {namespaces.map((ns) => (
          <option key={ns.name} value={ns.name}>
            {ns.name}
          </option>
        ))}
      </select>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

/**
 * 리소스 탭 컴포넌트
 */
function ResourceTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ResourceTab;
  onTabChange: (tab: ResourceTab) => void;
}) {
  const tabs: { key: ResourceTab; label: string; icon: React.ElementType }[] = [
    { key: 'topology', label: 'Topology', icon: Network },
    { key: 'pods', label: 'Pods', icon: Box },
    { key: 'services', label: 'Services', icon: Globe },
    { key: 'deployments', label: 'Deployments', icon: Layers },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Kubernetes Admin 페이지 컴포넌트
 */
export default function KubernetesAdminPage() {
  // 선택된 클러스터 상태
  const [selectedCluster, setSelectedCluster] = useState<KubernetesClusterDto | null>(null);

  // 선택된 네임스페이스 상태
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);

  // 활성 탭 상태
  const [activeTab, setActiveTab] = useState<ResourceTab>('pods');

  // 클러스터 선택 핸들러
  const handleClusterSelect = useCallback((cluster: KubernetesClusterDto) => {
    setSelectedCluster(cluster);
    setSelectedNamespace(cluster.defaultNamespace || null);
    setActiveTab('topology');
  }, []);

  // 클러스터 선택 해제 (뒤로가기)
  const handleDeselectCluster = useCallback(() => {
    setSelectedCluster(null);
    setSelectedNamespace(null);
  }, []);

  // 네임스페이스 변경 핸들러
  const handleNamespaceChange = useCallback((ns: string | null) => {
    setSelectedNamespace(ns);
  }, []);

  return (
    <AdminOnly fallback={<p className="p-4 text-muted-foreground">Kubernetes 관리 권한이 없습니다. Admin 역할이 필요합니다.</p>}>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kubernetes 관리</h1>
              <p className="text-sm text-muted-foreground">
                Kubernetes 클러스터와 리소스를 관리합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 클러스터 미선택 시: 클러스터 설정/목록 */}
        {!selectedCluster && (
          <K8sClusterSetup
            onClusterSelect={handleClusterSelect}
            selectedClusterId={null}
          />
        )}

        {/* 클러스터 선택 시: 리소스 대시보드 */}
        {selectedCluster && (
          <div className="space-y-6">
            {/* 선택된 클러스터 헤더 + 뒤로가기 */}
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectCluster}
                className="shrink-0"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                목록
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="font-semibold truncate">{selectedCluster.name}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {selectedCluster.server}
                </p>
              </div>

              {/* 네임스페이스 셀렉터 */}
              <NamespaceSelector
                clusterId={selectedCluster.id}
                selectedNamespace={selectedNamespace}
                onSelect={handleNamespaceChange}
              />
            </div>

            {/* 리소스 탭 + 콘텐츠 */}
            <div className="space-y-4">
              <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* 탭 콘텐츠 */}
              {activeTab === 'topology' && (
                <ServiceTopology
                  clusterId={selectedCluster.id}
                  namespace={selectedNamespace ?? undefined}
                  refreshInterval={30000}
                />
              )}
              {activeTab === 'pods' && (
                <K8sPodList
                  clusterId={selectedCluster.id}
                  namespace={selectedNamespace ?? undefined}
                  refreshInterval={30000}
                />
              )}
              {activeTab === 'services' && (
                <K8sServiceList
                  clusterId={selectedCluster.id}
                  namespace={selectedNamespace ?? undefined}
                  refreshInterval={60000}
                />
              )}
              {activeTab === 'deployments' && (
                <K8sDeploymentList
                  clusterId={selectedCluster.id}
                  namespace={selectedNamespace ?? undefined}
                  refreshInterval={30000}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
}
