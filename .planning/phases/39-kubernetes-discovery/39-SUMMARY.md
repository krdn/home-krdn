# Phase 39: Kubernetes Discovery - Summary

## 완료일: 2026-01-16

## 목표

Kubernetes API 연동 및 리소스 목록화 — 클러스터 연결, namespace/pod/service 조회

## 구현 내용

### 39-01: Prisma 모델 + Service Layer

#### Prisma 모델 (KubernetesCluster)

```prisma
model KubernetesCluster {
  id                String  @id @default(cuid())
  name              String
  userId            String
  server            String
  caData            String?
  skipTLSVerify     Boolean @default(false)
  authType          String  @default("token")
  token             String?
  clientCertificate String?
  clientKey         String?
  defaultNamespace  String  @default("default")
  isActive          Boolean @default(true)
  createdAt         DateTime
  updatedAt         DateTime

  @@unique([userId, name])
}
```

#### Zod 타입 정의 (src/types/kubernetes.ts)

- `CreateKubernetesClusterInputSchema` - 클러스터 생성 입력
- `UpdateKubernetesClusterInputSchema` - 클러스터 수정 입력
- `KubernetesClusterDtoSchema` - 응답 DTO (토큰 값 미노출)
- `K8sNamespaceSchema` - Namespace 리소스
- `K8sPodSchema` - Pod 리소스 (컨테이너 상태 포함)
- `K8sServiceSchema` - Service 리소스 (포트 매핑 포함)
- `K8sDeploymentSchema` - Deployment 리소스 (레플리카 상태 포함)

#### Service Layer (src/lib/kubernetes-service.ts)

| 함수 | 설명 |
|------|------|
| `getClusters(userId)` | 사용자의 클러스터 목록 |
| `getCluster(clusterId, userId)` | 클러스터 상세 |
| `createCluster(userId, input)` | 클러스터 추가 (연결 테스트 포함) |
| `updateCluster(clusterId, userId, input)` | 클러스터 수정 |
| `deleteCluster(clusterId, userId)` | 클러스터 삭제 |
| `toggleClusterActive(clusterId, userId)` | 활성화 토글 |
| `validateClusterConnection(clusterId, userId)` | 연결 테스트 |
| `getNamespaces(clusterId, userId)` | Namespace 목록 |
| `getPods(clusterId, userId, filter?)` | Pod 목록 |
| `getServices(clusterId, userId, filter?)` | Service 목록 |
| `getDeployments(clusterId, userId, filter?)` | Deployment 목록 |

### 39-02: REST API 엔드포인트 (9개)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/kubernetes/clusters` | GET | 클러스터 목록 |
| `/api/kubernetes/clusters` | POST | 클러스터 추가 |
| `/api/kubernetes/clusters/[clusterId]` | GET | 클러스터 상세 |
| `/api/kubernetes/clusters/[clusterId]` | PUT | 클러스터 수정 |
| `/api/kubernetes/clusters/[clusterId]` | DELETE | 클러스터 삭제 |
| `/api/kubernetes/clusters/[clusterId]` | PATCH | 활성화 토글 |
| `/api/kubernetes/clusters/[clusterId]/test` | POST | 연결 테스트 |
| `/api/kubernetes/clusters/[clusterId]/namespaces` | GET | Namespace 목록 |
| `/api/kubernetes/clusters/[clusterId]/pods` | GET | Pod 목록 |
| `/api/kubernetes/clusters/[clusterId]/services` | GET | Service 목록 |
| `/api/kubernetes/clusters/[clusterId]/deployments` | GET | Deployment 목록 |

## 기술 스택

- **@kubernetes/client-node**: 공식 Kubernetes JavaScript 클라이언트
- **Prisma**: KubernetesCluster 모델 저장
- **Zod**: 스키마 검증 및 타입 생성

## 보안 고려사항

1. **토큰 미노출**: DTO에서 토큰 값 대신 `hasToken` boolean만 반환
2. **소유권 검증**: 모든 API에서 클러스터 소유자 확인
3. **연결 테스트**: 클러스터 추가/수정 시 연결 테스트 필수
4. **에러 처리**: K8s API 에러를 사용자 친화적 메시지로 변환

## 파일 구조

```
src/
├── types/
│   └── kubernetes.ts          # Zod 스키마 및 타입
├── lib/
│   └── kubernetes-service.ts  # 서비스 레이어
└── app/api/kubernetes/
    └── clusters/
        ├── route.ts           # 목록/추가
        └── [clusterId]/
            ├── route.ts       # 상세/수정/삭제/토글
            ├── test/route.ts  # 연결 테스트
            ├── namespaces/route.ts
            ├── pods/route.ts
            ├── services/route.ts
            └── deployments/route.ts
```

## 다음 단계 (Phase 40)

Phase 40에서는 K8s Dashboard UI를 구현합니다:
- 클러스터 설정 UI
- Pod/Service/Deployment 목록 컴포넌트
- 실시간 상태 모니터링
