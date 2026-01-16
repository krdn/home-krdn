# Phase 39: Kubernetes Discovery - Research

## 목표

Kubernetes API 연동 및 리소스 목록화 — 클러스터 연결, namespace/pod/service 조회

## 리서치 결과

### 라이브러리 선택: @kubernetes/client-node

**공식 Kubernetes JavaScript/TypeScript 클라이언트**

```bash
npm install @kubernetes/client-node
```

- **GitHub**: https://github.com/kubernetes-client/javascript
- **npm**: https://www.npmjs.com/package/@kubernetes/client-node
- **호환성**: Kubernetes 1.28~1.34 지원 (client 1.4.x)
- **라이선스**: Apache-2.0

### 주요 API 클라이언트

| API Client | 용도 |
|------------|------|
| `CoreV1Api` | Pod, Service, Namespace, ConfigMap, Secret 등 핵심 리소스 |
| `AppsV1Api` | Deployment, StatefulSet, DaemonSet, ReplicaSet |
| `BatchV1Api` | Job, CronJob |
| `NetworkingV1Api` | Ingress, NetworkPolicy |

### KubeConfig 로딩 방식

#### 1. 기본 로딩 (kubeconfig 파일)
```typescript
const kc = new k8s.KubeConfig();
kc.loadFromDefault(); // ~/.kube/config 또는 KUBECONFIG 환경변수
```

#### 2. 프로그래매틱 로딩 (DB 저장 데이터 활용)
```typescript
kc.loadFromOptions({
  clusters: [{
    name: 'my-cluster',
    server: 'https://k8s-api-server:6443',
    caData: 'base64-ca-cert',
    skipTLSVerify: false,
  }],
  users: [{
    name: 'my-user',
    token: 'bearer-token', // 또는 clientCertificate + clientKey
  }],
  contexts: [{
    name: 'my-context',
    cluster: 'my-cluster',
    user: 'my-user',
    namespace: 'default',
  }],
  currentContext: 'my-context',
});
```

#### 3. 인클러스터 로딩 (Pod 내부 실행 시)
```typescript
kc.loadFromCluster(); // ServiceAccount 토큰 자동 사용
```

### 주요 API 사용 예시

```typescript
// Pod 목록 조회
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const pods = await coreApi.listNamespacedPod({ namespace: 'default' });

// Deployment 목록 조회
const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const deployments = await appsApi.listNamespacedDeployment({ namespace: 'default' });

// Service 목록 조회
const services = await coreApi.listNamespacedService({ namespace: 'default' });

// Namespace 목록 조회 (클러스터 레벨)
const namespaces = await coreApi.listNamespace();
```

### 인증 방식

1. **Bearer Token**: ServiceAccount 토큰 또는 OIDC 토큰
2. **Client Certificate**: 클라이언트 인증서 + 키
3. **Basic Auth**: 사용자명/비밀번호 (비권장)

### 보안 고려사항

- **토큰 암호화**: DB 저장 시 암호화 필수 (GitHub 토큰과 동일 패턴)
- **최소 권한**: 필요한 리소스만 조회하는 RBAC 권한 부여
- **CA 인증서**: skipTLSVerify는 개발용으로만 사용
- **Namespace 스코프**: 가능하면 namespace 단위로 권한 제한

### 구현 결정사항

1. **인증 정보 저장**: GitHub 설정과 유사하게 `KubernetesSettings` Prisma 모델
2. **kubeconfig 형식**: JSON으로 DB 저장 (clusters, users, contexts)
3. **멀티 클러스터**: 사용자별 여러 클러스터 설정 지원 (배열)
4. **토큰 검증**: 연결 시 namespace 목록 조회로 검증
5. **에러 핸들링**: GitHub 서비스와 동일한 패턴 적용

## 구현 계획

### Plan 39-01: Prisma 모델 + Service Layer
- KubernetesSettings Prisma 모델 (사용자별 1:N 클러스터)
- kubernetes-service.ts 서비스 레이어
- Zod 타입 정의 (src/types/kubernetes.ts)

### Plan 39-02: REST API 엔드포인트
- /api/kubernetes/settings (CRUD)
- /api/kubernetes/namespaces
- /api/kubernetes/pods
- /api/kubernetes/services
- /api/kubernetes/deployments

## 참고 자료

- [@kubernetes/client-node GitHub](https://github.com/kubernetes-client/javascript)
- [@kubernetes/client-node npm](https://www.npmjs.com/package/@kubernetes/client-node)
- [Kubernetes API 공식 문서](https://kubernetes.io/docs/reference/kubernetes-api/)
