'use client';

/**
 * K8sClusterSetup 컴포넌트
 *
 * Kubernetes 클러스터 설정 및 관리
 * - 새 클러스터 추가 폼
 * - 클러스터 목록
 * - 연결 테스트
 *
 * Phase 40: K8s Dashboard
 */

import { useState, useCallback } from 'react';
import {
  Server,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  RefreshCw,
  Power,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useK8sClusters, useK8sClusterMutation } from '@/hooks/useKubernetes';
import type { KubernetesClusterDto, CreateKubernetesClusterInput } from '@/types/kubernetes';

interface K8sClusterSetupProps {
  onClusterSelect?: (cluster: KubernetesClusterDto) => void;
  selectedClusterId?: string | null;
}

/**
 * K8sClusterSetup 컴포넌트
 */
export function K8sClusterSetup({ onClusterSelect, selectedClusterId }: K8sClusterSetupProps) {
  const { clusters, isLoading, refetch } = useK8sClusters();
  const { createCluster, deleteCluster, toggleCluster, testConnection } = useK8sClusterMutation();

  // 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateKubernetesClusterInput>>({
    name: '',
    server: '',
    token: '',
    defaultNamespace: 'default',
    skipTLSVerify: false,
    authType: 'token',
  });

  // 연결 테스트 결과 상태
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // 폼 입력 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }, []);

  // 클러스터 추가 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.server || !formData.token) {
      return;
    }

    try {
      await createCluster.mutateAsync(formData as CreateKubernetesClusterInput);
      setFormData({
        name: '',
        server: '',
        token: '',
        defaultNamespace: 'default',
        skipTLSVerify: false,
        authType: 'token',
      });
      setShowForm(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  }, [formData, createCluster]);

  // 클러스터 삭제 핸들러
  const handleDelete = useCallback(async (clusterId: string) => {
    if (!confirm('정말로 이 클러스터를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteCluster.mutateAsync(clusterId);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  }, [deleteCluster]);

  // 활성화 토글 핸들러
  const handleToggle = useCallback(async (clusterId: string) => {
    try {
      await toggleCluster.mutateAsync(clusterId);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  }, [toggleCluster]);

  // 연결 테스트 핸들러
  const handleTestConnection = useCallback(async (clusterId: string) => {
    setTestResults((prev) => ({
      ...prev,
      [clusterId]: { success: false, message: '테스트 중...' },
    }));

    try {
      const result = await testConnection.mutateAsync(clusterId);
      if (result.success && result.data) {
        setTestResults((prev) => ({
          ...prev,
          [clusterId]: {
            success: result.data!.success,
            message: result.data!.success
              ? `연결 성공 (v${result.data!.version}, ${result.data!.namespaceCount}개 NS)`
              : result.data!.error || '연결 실패',
          },
        }));
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [clusterId]: {
          success: false,
          message: error instanceof Error ? error.message : '테스트 실패',
        },
      }));
    }
  }, [testConnection]);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">클러스터 목록</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                닫기
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                클러스터 추가
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 클러스터 추가 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                클러스터 이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="production-cluster"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="server" className="block text-sm font-medium mb-1">
                API 서버 URL *
              </label>
              <input
                type="url"
                id="server"
                name="server"
                value={formData.server}
                onChange={handleInputChange}
                placeholder="https://kubernetes.example.com:6443"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-1">
              Bearer 토큰 *
            </label>
            <input
              type="password"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              placeholder="eyJhbGciOi..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              ServiceAccount 토큰 또는 사용자 토큰을 입력하세요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="defaultNamespace" className="block text-sm font-medium mb-1">
                기본 Namespace
              </label>
              <input
                type="text"
                id="defaultNamespace"
                name="defaultNamespace"
                value={formData.defaultNamespace}
                onChange={handleInputChange}
                placeholder="default"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="skipTLSVerify"
                name="skipTLSVerify"
                checked={formData.skipTLSVerify}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border"
              />
              <label htmlFor="skipTLSVerify" className="text-sm">
                TLS 검증 건너뛰기 (개발용)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createCluster.isPending}>
              {createCluster.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  연결 테스트 중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  추가
                </>
              )}
            </Button>
          </div>

          {createCluster.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {createCluster.error.message}
            </div>
          )}
        </form>
      )}

      {/* 클러스터 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border bg-card p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
          <Server className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">등록된 클러스터가 없습니다.</p>
          <p className="text-sm text-muted-foreground">위의 &quot;클러스터 추가&quot; 버튼을 클릭하여 시작하세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                selectedClusterId === cluster.id
                  ? 'border-primary bg-primary/5'
                  : 'bg-card hover:bg-accent/50'
              } ${!cluster.isActive ? 'opacity-60' : ''}`}
            >
              {/* 클러스터 정보 */}
              <button
                type="button"
                className="flex flex-1 items-center gap-4 text-left"
                onClick={() => cluster.isActive && onClusterSelect?.(cluster)}
                disabled={!cluster.isActive}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  cluster.isActive ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Server className={`h-5 w-5 ${cluster.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{cluster.name}</span>
                    {!cluster.isActive && (
                      <span className="text-xs text-muted-foreground">(비활성)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{cluster.server}</p>
                </div>
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {cluster.defaultNamespace}
                </div>
              </button>

              {/* 테스트 결과 */}
              {testResults[cluster.id] && (
                <div className={`hidden md:flex items-center gap-1 text-xs ${
                  testResults[cluster.id].success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResults[cluster.id].success ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span className="max-w-[200px] truncate">{testResults[cluster.id].message}</span>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(cluster.id)}
                  disabled={testConnection.isPending}
                  title="연결 테스트"
                >
                  <RefreshCw className={`h-4 w-4 ${testConnection.isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(cluster.id)}
                  disabled={toggleCluster.isPending}
                  title={cluster.isActive ? '비활성화' : '활성화'}
                >
                  <Power className={`h-4 w-4 ${cluster.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cluster.id)}
                  disabled={deleteCluster.isPending}
                  title="삭제"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
