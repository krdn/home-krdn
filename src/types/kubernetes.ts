/**
 * Kubernetes API 타입 정의 (Zod)
 *
 * Phase 39: Kubernetes Discovery
 * - 클러스터 설정 스키마
 * - K8s 리소스 스키마 (Namespace, Pod, Service, Deployment)
 */
import { z } from 'zod';

// ============================================================
// Auth Type
// ============================================================

export const AuthTypeSchema = z.enum(['token', 'certificate']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// ============================================================
// Cluster 입력 스키마
// ============================================================

export const CreateKubernetesClusterInputSchema = z.object({
  name: z
    .string()
    .min(1, '클러스터 이름은 필수입니다')
    .max(100, '클러스터 이름은 100자 이하여야 합니다'),
  server: z
    .string()
    .url('유효한 URL 형식이어야 합니다')
    .refine((url) => url.startsWith('https://') || url.startsWith('http://'), {
      message: 'http:// 또는 https://로 시작해야 합니다',
    }),
  caData: z.string().optional(),
  skipTLSVerify: z.boolean().optional().default(false),
  authType: AuthTypeSchema.optional().default('token'),
  token: z.string().optional(),
  clientCertificate: z.string().optional(),
  clientKey: z.string().optional(),
  defaultNamespace: z.string().optional().default('default'),
});

export const UpdateKubernetesClusterInputSchema = CreateKubernetesClusterInputSchema.partial();

export type CreateKubernetesClusterInput = z.infer<typeof CreateKubernetesClusterInputSchema>;
export type UpdateKubernetesClusterInput = z.infer<typeof UpdateKubernetesClusterInputSchema>;

// ============================================================
// Cluster DTO 스키마 (응답용 - 토큰 값 미노출)
// ============================================================

export const KubernetesClusterDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string(),
  server: z.string(),
  skipTLSVerify: z.boolean(),
  authType: AuthTypeSchema,
  hasToken: z.boolean(),
  hasCertificate: z.boolean(),
  defaultNamespace: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KubernetesClusterDto = z.infer<typeof KubernetesClusterDtoSchema>;

// ============================================================
// 연결 테스트 결과
// ============================================================

export const ClusterConnectionResultSchema = z.object({
  success: z.boolean(),
  version: z.string().optional(),
  namespaceCount: z.number().optional(),
  error: z.string().optional(),
});

export type ClusterConnectionResult = z.infer<typeof ClusterConnectionResultSchema>;

// ============================================================
// Kubernetes 리소스 스키마
// ============================================================

// Namespace
export const K8sNamespaceSchema = z.object({
  name: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
});

export type K8sNamespace = z.infer<typeof K8sNamespaceSchema>;

// Container Status (Pod 내부)
export const K8sContainerStatusSchema = z.object({
  name: z.string(),
  image: z.string(),
  ready: z.boolean(),
  restartCount: z.number(),
  state: z.string(), // running, waiting, terminated
});

export type K8sContainerStatus = z.infer<typeof K8sContainerStatusSchema>;

// Pod
export const K8sPodSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  status: z.string(), // Running, Pending, Failed, Succeeded, Unknown
  phase: z.string(),
  nodeName: z.string().optional(),
  podIP: z.string().optional(),
  hostIP: z.string().optional(),
  containers: z.array(K8sContainerStatusSchema),
  createdAt: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
});

export type K8sPod = z.infer<typeof K8sPodSchema>;

// Service Port
export const K8sServicePortSchema = z.object({
  name: z.string().optional(),
  port: z.number(),
  targetPort: z.union([z.number(), z.string()]),
  protocol: z.string(),
  nodePort: z.number().optional(),
});

export type K8sServicePort = z.infer<typeof K8sServicePortSchema>;

// Service
export const K8sServiceSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  type: z.string(), // ClusterIP, NodePort, LoadBalancer, ExternalName
  clusterIP: z.string().optional(),
  externalIP: z.string().optional(),
  loadBalancerIP: z.string().optional(),
  ports: z.array(K8sServicePortSchema),
  selector: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
});

export type K8sService = z.infer<typeof K8sServiceSchema>;

// Deployment
export const K8sDeploymentSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  replicas: z.number(),
  readyReplicas: z.number(),
  availableReplicas: z.number(),
  updatedReplicas: z.number(),
  strategy: z.string(), // RollingUpdate, Recreate
  selector: z.record(z.string(), z.string()).optional(),
  createdAt: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  conditions: z.array(z.object({
    type: z.string(),
    status: z.string(),
    reason: z.string().optional(),
    message: z.string().optional(),
  })).optional(),
});

export type K8sDeployment = z.infer<typeof K8sDeploymentSchema>;

// ============================================================
// 필터 타입
// ============================================================

export interface ResourceFilter {
  namespace?: string;
  labelSelector?: string;
  fieldSelector?: string;
  limit?: number;
}

// ============================================================
// API 응답 타입
// ============================================================

export interface K8sApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
