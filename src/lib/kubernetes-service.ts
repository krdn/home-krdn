/**
 * Kubernetes Service
 * @kubernetes/client-node 기반 Kubernetes API 클라이언트
 *
 * Phase 39: Kubernetes Discovery
 * - KubeConfig 동적 로딩 (DB 저장 데이터 활용)
 * - 클러스터 CRUD
 * - Namespace, Pod, Service, Deployment 조회
 */

import * as k8s from '@kubernetes/client-node';
import prisma from '@/lib/prisma';
import type {
  KubernetesClusterDto,
  CreateKubernetesClusterInput,
  UpdateKubernetesClusterInput,
  ClusterConnectionResult,
  K8sNamespace,
  K8sPod,
  K8sService,
  K8sDeployment,
  ResourceFilter,
  ServiceTopology,
  TopologyNode,
  TopologyEdge,
} from '@/types/kubernetes';

// ============================================================
// 타입 정의
// ============================================================

/**
 * Prisma KubernetesCluster 타입
 */
type KubernetesClusterEntity = {
  id: string;
  name: string;
  userId: string;
  server: string;
  caData: string | null;
  skipTLSVerify: boolean;
  authType: string;
  token: string | null;
  clientCertificate: string | null;
  clientKey: string | null;
  defaultNamespace: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * Prisma KubernetesCluster를 DTO로 변환
 * - token, clientKey 등 민감 정보 미노출
 * - hasToken, hasCertificate boolean만 노출
 */
function toClusterDto(entity: KubernetesClusterEntity): KubernetesClusterDto {
  return {
    id: entity.id,
    name: entity.name,
    userId: entity.userId,
    server: entity.server,
    skipTLSVerify: entity.skipTLSVerify,
    authType: entity.authType as 'token' | 'certificate',
    hasToken: !!entity.token,
    hasCertificate: !!(entity.clientCertificate && entity.clientKey),
    defaultNamespace: entity.defaultNamespace,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

/**
 * DB 저장된 클러스터 정보로 KubeConfig 생성
 */
function buildKubeConfig(cluster: KubernetesClusterEntity): k8s.KubeConfig {
  const kc = new k8s.KubeConfig();

  // 클러스터 설정 객체 생성
  const clusterConfig = {
    name: cluster.name,
    server: cluster.server,
    skipTLSVerify: cluster.skipTLSVerify,
    caData: cluster.caData ?? undefined,
  };

  // 사용자 설정 객체 생성
  const userConfig: {
    name: string;
    token?: string;
    certData?: string;
    keyData?: string;
  } = {
    name: `${cluster.name}-user`,
  };

  // 인증 설정
  if (cluster.authType === 'token' && cluster.token) {
    userConfig.token = cluster.token;
  } else if (
    cluster.authType === 'certificate' &&
    cluster.clientCertificate &&
    cluster.clientKey
  ) {
    userConfig.certData = cluster.clientCertificate;
    userConfig.keyData = cluster.clientKey;
  }

  // 컨텍스트 설정 객체 생성
  const contextConfig = {
    name: `${cluster.name}-context`,
    cluster: cluster.name,
    user: `${cluster.name}-user`,
    namespace: cluster.defaultNamespace,
  };

  kc.loadFromOptions({
    clusters: [clusterConfig],
    users: [userConfig],
    contexts: [contextConfig],
    currentContext: `${cluster.name}-context`,
  });

  return kc;
}

// ============================================================
// KubeConfig 인스턴스 관리
// ============================================================

/**
 * 클러스터 ID로 KubeConfig 인스턴스를 생성합니다.
 *
 * @param clusterId 클러스터 ID
 * @returns KubeConfig 인스턴스
 * @throws 클러스터가 없거나 인증 정보가 없으면 에러
 */
export async function getKubeConfigForCluster(
  clusterId: string
): Promise<k8s.KubeConfig> {
  const cluster = await prisma.kubernetesCluster.findUnique({
    where: { id: clusterId },
  });

  if (!cluster) {
    throw new Error('클러스터를 찾을 수 없습니다.');
  }

  if (!cluster.isActive) {
    throw new Error('비활성화된 클러스터입니다.');
  }

  if (cluster.authType === 'token' && !cluster.token) {
    throw new Error('클러스터 토큰이 설정되지 않았습니다.');
  }

  if (
    cluster.authType === 'certificate' &&
    (!cluster.clientCertificate || !cluster.clientKey)
  ) {
    throw new Error('클러스터 인증서가 설정되지 않았습니다.');
  }

  return buildKubeConfig(cluster);
}

/**
 * 클러스터 소유권 검증
 */
export async function verifyClusterOwnership(
  clusterId: string,
  userId: string
): Promise<KubernetesClusterEntity> {
  const cluster = await prisma.kubernetesCluster.findUnique({
    where: { id: clusterId },
  });

  if (!cluster) {
    throw new Error('클러스터를 찾을 수 없습니다.');
  }

  if (cluster.userId !== userId) {
    throw new Error('클러스터에 대한 접근 권한이 없습니다.');
  }

  return cluster;
}

// ============================================================
// Cluster CRUD
// ============================================================

/**
 * 사용자의 클러스터 목록을 조회합니다.
 *
 * @param userId 사용자 ID
 * @returns KubernetesClusterDto 배열
 */
export async function getClusters(
  userId: string
): Promise<KubernetesClusterDto[]> {
  const clusters = await prisma.kubernetesCluster.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return clusters.map(toClusterDto);
}

/**
 * 클러스터 상세 조회
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID (소유권 검증)
 * @returns KubernetesClusterDto
 */
export async function getCluster(
  clusterId: string,
  userId: string
): Promise<KubernetesClusterDto> {
  const cluster = await verifyClusterOwnership(clusterId, userId);
  return toClusterDto(cluster);
}

/**
 * 새 클러스터를 추가합니다.
 * 연결 테스트 후 성공 시에만 저장합니다.
 *
 * @param userId 사용자 ID
 * @param input 클러스터 입력
 * @returns 생성된 KubernetesClusterDto
 */
export async function createCluster(
  userId: string,
  input: CreateKubernetesClusterInput
): Promise<KubernetesClusterDto> {
  // 이름 중복 확인
  const existing = await prisma.kubernetesCluster.findUnique({
    where: {
      userId_name: {
        userId,
        name: input.name,
      },
    },
  });

  if (existing) {
    throw new Error(`이미 "${input.name}" 이름의 클러스터가 존재합니다.`);
  }

  // 임시 클러스터 엔티티 생성 (연결 테스트용)
  const tempCluster: KubernetesClusterEntity = {
    id: 'temp',
    name: input.name,
    userId,
    server: input.server,
    caData: input.caData ?? null,
    skipTLSVerify: input.skipTLSVerify ?? false,
    authType: input.authType ?? 'token',
    token: input.token ?? null,
    clientCertificate: input.clientCertificate ?? null,
    clientKey: input.clientKey ?? null,
    defaultNamespace: input.defaultNamespace ?? 'default',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 연결 테스트
  const testResult = await testClusterConnection(tempCluster);

  if (!testResult.success) {
    throw new Error(
      testResult.error || '클러스터 연결에 실패했습니다.'
    );
  }

  // DB 저장
  const cluster = await prisma.kubernetesCluster.create({
    data: {
      name: input.name,
      userId,
      server: input.server,
      caData: input.caData,
      skipTLSVerify: input.skipTLSVerify ?? false,
      authType: input.authType ?? 'token',
      token: input.token,
      clientCertificate: input.clientCertificate,
      clientKey: input.clientKey,
      defaultNamespace: input.defaultNamespace ?? 'default',
    },
  });

  return toClusterDto(cluster);
}

/**
 * 클러스터 정보를 업데이트합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @param input 업데이트 입력
 * @returns 업데이트된 KubernetesClusterDto
 */
export async function updateCluster(
  clusterId: string,
  userId: string,
  input: UpdateKubernetesClusterInput
): Promise<KubernetesClusterDto> {
  const existing = await verifyClusterOwnership(clusterId, userId);

  // 이름 변경 시 중복 확인
  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.kubernetesCluster.findUnique({
      where: {
        userId_name: {
          userId,
          name: input.name,
        },
      },
    });

    if (duplicate) {
      throw new Error(`이미 "${input.name}" 이름의 클러스터가 존재합니다.`);
    }
  }

  // 연결 정보 변경 시 테스트
  const needsTest =
    input.server !== undefined ||
    input.token !== undefined ||
    input.clientCertificate !== undefined ||
    input.clientKey !== undefined ||
    input.caData !== undefined;

  if (needsTest) {
    const tempCluster: KubernetesClusterEntity = {
      ...existing,
      ...input,
      server: input.server ?? existing.server,
      caData: input.caData !== undefined ? input.caData ?? null : existing.caData,
      token: input.token !== undefined ? input.token ?? null : existing.token,
      clientCertificate:
        input.clientCertificate !== undefined
          ? input.clientCertificate ?? null
          : existing.clientCertificate,
      clientKey:
        input.clientKey !== undefined
          ? input.clientKey ?? null
          : existing.clientKey,
    };

    const testResult = await testClusterConnection(tempCluster);

    if (!testResult.success) {
      throw new Error(
        testResult.error || '클러스터 연결 테스트에 실패했습니다.'
      );
    }
  }

  const cluster = await prisma.kubernetesCluster.update({
    where: { id: clusterId },
    data: {
      name: input.name,
      server: input.server,
      caData: input.caData,
      skipTLSVerify: input.skipTLSVerify,
      authType: input.authType,
      token: input.token,
      clientCertificate: input.clientCertificate,
      clientKey: input.clientKey,
      defaultNamespace: input.defaultNamespace,
    },
  });

  return toClusterDto(cluster);
}

/**
 * 클러스터를 삭제합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 */
export async function deleteCluster(
  clusterId: string,
  userId: string
): Promise<void> {
  await verifyClusterOwnership(clusterId, userId);

  await prisma.kubernetesCluster.delete({
    where: { id: clusterId },
  });
}

/**
 * 클러스터 활성화/비활성화 토글
 */
export async function toggleClusterActive(
  clusterId: string,
  userId: string
): Promise<KubernetesClusterDto> {
  const existing = await verifyClusterOwnership(clusterId, userId);

  const cluster = await prisma.kubernetesCluster.update({
    where: { id: clusterId },
    data: { isActive: !existing.isActive },
  });

  return toClusterDto(cluster);
}

// ============================================================
// 연결 테스트
// ============================================================

/**
 * 클러스터 연결을 테스트합니다.
 * namespace 목록 조회로 연결 상태를 확인합니다.
 */
async function testClusterConnection(
  cluster: KubernetesClusterEntity
): Promise<ClusterConnectionResult> {
  try {
    const kc = buildKubeConfig(cluster);
    const coreApi = kc.makeApiClient(k8s.CoreV1Api);
    const versionApi = kc.makeApiClient(k8s.VersionApi);

    // 버전 정보 조회
    const versionResponse = await versionApi.getCode();
    const version = versionResponse.gitVersion;

    // namespace 목록 조회 (권한 테스트)
    const nsResponse = await coreApi.listNamespace();
    const namespaceCount = nsResponse.items?.length ?? 0;

    return {
      success: true,
      version,
      namespaceCount,
    };
  } catch (error) {
    return {
      success: false,
      error: handleK8sError(error, '연결 테스트'),
    };
  }
}

/**
 * 클러스터 연결 테스트 (외부 호출용)
 */
export async function validateClusterConnection(
  clusterId: string,
  userId: string
): Promise<ClusterConnectionResult> {
  const cluster = await verifyClusterOwnership(clusterId, userId);
  return testClusterConnection(cluster);
}

// ============================================================
// Namespace 조회
// ============================================================

/**
 * 네임스페이스 목록을 조회합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @returns K8sNamespace 배열
 */
export async function getNamespaces(
  clusterId: string,
  userId: string
): Promise<K8sNamespace[]> {
  await verifyClusterOwnership(clusterId, userId);
  const kc = await getKubeConfigForCluster(clusterId);
  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  try {
    const response = await coreApi.listNamespace();

    return (response.items ?? []).map((ns) => ({
      name: ns.metadata?.name ?? '',
      status: ns.status?.phase ?? 'Unknown',
      createdAt: ns.metadata?.creationTimestamp?.toISOString(),
      labels: ns.metadata?.labels as Record<string, string> | undefined,
    }));
  } catch (error) {
    throw new Error(handleK8sError(error, 'Namespace 목록 조회'));
  }
}

// ============================================================
// Pod 조회
// ============================================================

/**
 * Pod 목록을 조회합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @param filter 필터 옵션
 * @returns K8sPod 배열
 */
export async function getPods(
  clusterId: string,
  userId: string,
  filter?: ResourceFilter
): Promise<K8sPod[]> {
  const cluster = await verifyClusterOwnership(clusterId, userId);
  const kc = await getKubeConfigForCluster(clusterId);
  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  const namespace = filter?.namespace ?? cluster.defaultNamespace;

  try {
    const response = await coreApi.listNamespacedPod({
      namespace,
      labelSelector: filter?.labelSelector,
      fieldSelector: filter?.fieldSelector,
      limit: filter?.limit,
    });

    return (response.items ?? []).map((pod) => ({
      name: pod.metadata?.name ?? '',
      namespace: pod.metadata?.namespace ?? namespace,
      status: pod.status?.phase ?? 'Unknown',
      phase: pod.status?.phase ?? 'Unknown',
      nodeName: pod.spec?.nodeName,
      podIP: pod.status?.podIP,
      hostIP: pod.status?.hostIP,
      containers: (pod.status?.containerStatuses ?? []).map((cs) => ({
        name: cs.name,
        image: cs.image,
        ready: cs.ready,
        restartCount: cs.restartCount,
        state: cs.state?.running
          ? 'running'
          : cs.state?.waiting
            ? 'waiting'
            : cs.state?.terminated
              ? 'terminated'
              : 'unknown',
      })),
      createdAt: pod.metadata?.creationTimestamp?.toISOString(),
      labels: pod.metadata?.labels as Record<string, string> | undefined,
    }));
  } catch (error) {
    throw new Error(handleK8sError(error, `Pod 목록 조회 (${namespace})`));
  }
}

// ============================================================
// Service 조회
// ============================================================

/**
 * Service 목록을 조회합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @param filter 필터 옵션
 * @returns K8sService 배열
 */
export async function getServices(
  clusterId: string,
  userId: string,
  filter?: ResourceFilter
): Promise<K8sService[]> {
  const cluster = await verifyClusterOwnership(clusterId, userId);
  const kc = await getKubeConfigForCluster(clusterId);
  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  const namespace = filter?.namespace ?? cluster.defaultNamespace;

  try {
    const response = await coreApi.listNamespacedService({
      namespace,
      labelSelector: filter?.labelSelector,
      fieldSelector: filter?.fieldSelector,
      limit: filter?.limit,
    });

    return (response.items ?? []).map((svc) => ({
      name: svc.metadata?.name ?? '',
      namespace: svc.metadata?.namespace ?? namespace,
      type: svc.spec?.type ?? 'ClusterIP',
      clusterIP: svc.spec?.clusterIP,
      externalIP: svc.status?.loadBalancer?.ingress?.[0]?.ip,
      loadBalancerIP: svc.spec?.loadBalancerIP,
      ports: (svc.spec?.ports ?? []).map((port) => ({
        name: port.name,
        port: port.port,
        targetPort: port.targetPort ?? port.port,
        protocol: port.protocol ?? 'TCP',
        nodePort: port.nodePort,
      })),
      selector: svc.spec?.selector as Record<string, string> | undefined,
      createdAt: svc.metadata?.creationTimestamp?.toISOString(),
      labels: svc.metadata?.labels as Record<string, string> | undefined,
    }));
  } catch (error) {
    throw new Error(handleK8sError(error, `Service 목록 조회 (${namespace})`));
  }
}

// ============================================================
// Deployment 조회
// ============================================================

/**
 * Deployment 목록을 조회합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @param filter 필터 옵션
 * @returns K8sDeployment 배열
 */
export async function getDeployments(
  clusterId: string,
  userId: string,
  filter?: ResourceFilter
): Promise<K8sDeployment[]> {
  const cluster = await verifyClusterOwnership(clusterId, userId);
  const kc = await getKubeConfigForCluster(clusterId);
  const appsApi = kc.makeApiClient(k8s.AppsV1Api);

  const namespace = filter?.namespace ?? cluster.defaultNamespace;

  try {
    const response = await appsApi.listNamespacedDeployment({
      namespace,
      labelSelector: filter?.labelSelector,
      fieldSelector: filter?.fieldSelector,
      limit: filter?.limit,
    });

    return (response.items ?? []).map((deploy) => ({
      name: deploy.metadata?.name ?? '',
      namespace: deploy.metadata?.namespace ?? namespace,
      replicas: deploy.spec?.replicas ?? 0,
      readyReplicas: deploy.status?.readyReplicas ?? 0,
      availableReplicas: deploy.status?.availableReplicas ?? 0,
      updatedReplicas: deploy.status?.updatedReplicas ?? 0,
      strategy: deploy.spec?.strategy?.type ?? 'RollingUpdate',
      selector: deploy.spec?.selector?.matchLabels as
        | Record<string, string>
        | undefined,
      createdAt: deploy.metadata?.creationTimestamp?.toISOString(),
      labels: deploy.metadata?.labels as Record<string, string> | undefined,
      conditions: deploy.status?.conditions?.map((c) => ({
        type: c.type,
        status: c.status,
        reason: c.reason,
        message: c.message,
      })),
    }));
  } catch (error) {
    throw new Error(handleK8sError(error, `Deployment 목록 조회 (${namespace})`));
  }
}

// ============================================================
// 에러 처리
// ============================================================

/**
 * Kubernetes API 에러를 처리합니다.
 *
 * @param error 에러 객체
 * @param operation 수행 중인 작업명
 * @returns 사용자 친화적 에러 메시지
 */
function handleK8sError(error: unknown, operation: string): string {
  if (error instanceof Error) {
    const message = error.message;

    // 인증 에러
    if (message.includes('401') || message.includes('Unauthorized')) {
      return `인증에 실패했습니다. 토큰 또는 인증서를 확인해주세요. (${operation})`;
    }

    // 권한 에러
    if (message.includes('403') || message.includes('Forbidden')) {
      return `접근 권한이 없습니다. 클러스터 RBAC 설정을 확인해주세요. (${operation})`;
    }

    // 찾을 수 없음
    if (message.includes('404') || message.includes('not found')) {
      return `리소스를 찾을 수 없습니다. (${operation})`;
    }

    // 연결 에러
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND')
    ) {
      return `클러스터에 연결할 수 없습니다. 서버 URL을 확인해주세요. (${operation})`;
    }

    // TLS 에러
    if (
      message.includes('certificate') ||
      message.includes('SSL') ||
      message.includes('TLS')
    ) {
      return `TLS 인증서 오류입니다. CA 인증서를 확인하거나 skipTLSVerify를 활성화해주세요. (${operation})`;
    }

    return `Kubernetes API 오류: ${message} (${operation})`;
  }

  return `알 수 없는 오류가 발생했습니다. (${operation})`;
}

// ============================================================
// Service Topology (Phase 41)
// ============================================================

/**
 * 레이블 셀렉터가 레이블과 매칭되는지 확인
 */
function matchesSelector(
  selector: Record<string, string> | undefined,
  labels: Record<string, string> | undefined
): boolean {
  if (!selector || !labels) return false;

  return Object.entries(selector).every(
    ([key, value]) => labels[key] === value
  );
}

/**
 * Pod 상태를 토폴로지 상태로 변환
 */
function getPodTopologyStatus(phase: string): string {
  switch (phase.toLowerCase()) {
    case 'running':
      return 'healthy';
    case 'pending':
      return 'warning';
    case 'failed':
    case 'unknown':
      return 'error';
    default:
      return 'unknown';
  }
}

/**
 * Deployment 상태를 토폴로지 상태로 변환
 */
function getDeploymentTopologyStatus(
  replicas: number,
  readyReplicas: number
): string {
  if (readyReplicas === replicas && replicas > 0) {
    return 'healthy';
  }
  if (readyReplicas > 0) {
    return 'warning';
  }
  return 'error';
}

/**
 * 서비스 토폴로지를 생성합니다.
 * Service → Deployment → Pod 연결 관계를 분석합니다.
 *
 * @param clusterId 클러스터 ID
 * @param userId 사용자 ID
 * @param namespace 네임스페이스 (optional, 없으면 모든 네임스페이스)
 * @returns ServiceTopology
 */
export async function getServiceTopology(
  clusterId: string,
  userId: string,
  namespace?: string
): Promise<ServiceTopology> {
  await verifyClusterOwnership(clusterId, userId);

  // 병렬로 리소스 조회
  const filter: ResourceFilter | undefined = namespace ? { namespace } : undefined;

  const [services, deployments, pods] = await Promise.all([
    getServices(clusterId, userId, filter),
    getDeployments(clusterId, userId, filter),
    getPods(clusterId, userId, filter),
  ]);

  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];

  // Service 노드 추가
  for (const svc of services) {
    const nodeId = `svc-${svc.namespace}-${svc.name}`;
    nodes.push({
      id: nodeId,
      type: 'service',
      name: svc.name,
      namespace: svc.namespace,
      status: 'healthy', // Service 자체는 항상 healthy로 간주
      metadata: {
        type: svc.type,
        clusterIP: svc.clusterIP,
        ports: svc.ports,
      },
    });
  }

  // Deployment 노드 추가
  for (const deploy of deployments) {
    const nodeId = `deploy-${deploy.namespace}-${deploy.name}`;
    nodes.push({
      id: nodeId,
      type: 'deployment',
      name: deploy.name,
      namespace: deploy.namespace,
      status: getDeploymentTopologyStatus(deploy.replicas, deploy.readyReplicas),
      metadata: {
        replicas: deploy.replicas,
        readyReplicas: deploy.readyReplicas,
        strategy: deploy.strategy,
      },
    });
  }

  // Pod 노드 추가
  for (const pod of pods) {
    const nodeId = `pod-${pod.namespace}-${pod.name}`;
    nodes.push({
      id: nodeId,
      type: 'pod',
      name: pod.name,
      namespace: pod.namespace,
      status: getPodTopologyStatus(pod.status),
      metadata: {
        nodeName: pod.nodeName,
        podIP: pod.podIP,
        containers: pod.containers.length,
      },
    });
  }

  // Service → Deployment 엣지 생성 (selector 매칭)
  for (const svc of services) {
    if (!svc.selector) continue;

    for (const deploy of deployments) {
      if (svc.namespace !== deploy.namespace) continue;

      // Deployment의 selector가 Service의 selector와 매칭되는지 확인
      if (matchesSelector(svc.selector, deploy.selector)) {
        const edgeId = `edge-svc-${svc.namespace}-${svc.name}-deploy-${deploy.name}`;
        edges.push({
          id: edgeId,
          source: `svc-${svc.namespace}-${svc.name}`,
          target: `deploy-${deploy.namespace}-${deploy.name}`,
          type: 'selector',
          label: 'routes to',
        });
      }
    }
  }

  // Deployment → Pod 엣지 생성 (selector 매칭)
  for (const deploy of deployments) {
    if (!deploy.selector) continue;

    for (const pod of pods) {
      if (deploy.namespace !== pod.namespace) continue;

      if (matchesSelector(deploy.selector, pod.labels)) {
        const edgeId = `edge-deploy-${deploy.namespace}-${deploy.name}-pod-${pod.name}`;
        edges.push({
          id: edgeId,
          source: `deploy-${deploy.namespace}-${deploy.name}`,
          target: `pod-${pod.namespace}-${pod.name}`,
          type: 'owner',
          label: 'manages',
        });
      }
    }
  }

  return {
    nodes,
    edges,
    namespace,
    generatedAt: new Date().toISOString(),
  };
}
