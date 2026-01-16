# Phase 41: Service Mesh Overview - 완료 요약

## Overview

React Flow를 사용하여 Kubernetes 서비스 토폴로지를 시각화합니다. Service → Deployment → Pod 연결 관계를 그래프로 표시합니다.

## 완료 항목

### 41-01: 서비스 토폴로지 데이터 모델 및 API

**타입 정의 (src/types/kubernetes.ts)**
- `TopologyNodeType`: 'service' | 'deployment' | 'pod' | 'ingress'
- `TopologyNode`: id, type, name, namespace, status, metadata
- `TopologyEdge`: id, source, target, type ('selector' | 'owner' | 'endpoint'), label
- `ServiceTopology`: nodes[], edges[], namespace, generatedAt

**서비스 함수 (src/lib/kubernetes-service.ts)**
- `getServiceTopology(clusterId, userId, namespace?)`: 토폴로지 생성
- `matchesSelector()`: 레이블 셀렉터 매칭
- `getPodTopologyStatus()`: Pod 상태 → 토폴로지 상태 변환
- `getDeploymentTopologyStatus()`: Deployment 상태 → 토폴로지 상태 변환

**REST API (src/app/api/kubernetes/clusters/[clusterId]/topology/route.ts)**
- `GET /api/kubernetes/clusters/:clusterId/topology?namespace=`
- 인증 필수, 클러스터 소유권 검증

**React Query 훅 (src/hooks/useKubernetes.ts)**
- `useK8sTopology(clusterId, namespace, options)`: 토폴로지 조회 훅

### 41-02: ServiceTopology 시각화 컴포넌트

**React Flow 컴포넌트 (src/components/kubernetes/ServiceTopology.tsx)**
- `@xyflow/react` 라이브러리 사용
- 커스텀 노드 컴포넌트 (타입별 아이콘/색상)
- 상태 인디케이터 (healthy/warning/error)
- 계층적 레이아웃 (Service → Deployment → Pod)
- 애니메이션 엣지 (selector 연결)
- MiniMap, Controls, Background

### 41-03: Admin Service Mesh 페이지 통합

**Admin Kubernetes 페이지 업데이트**
- Topology 탭 추가 (첫 번째 탭)
- Dynamic Import로 ServiceTopology 지연 로딩
- 네임스페이스 필터 적용

## 기술적 특징

### React Flow (XyFlow)
```tsx
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
```

### 토폴로지 생성 로직
```
1. 병렬로 Services, Deployments, Pods 조회
2. 각 리소스를 TopologyNode로 변환
3. Service → Deployment 엣지: selector 매칭
4. Deployment → Pod 엣지: selector와 labels 매칭
```

### 상태 색상
- `healthy`: 녹색 (#22c55e)
- `warning`: 노랑 (#eab308)
- `error`: 빨강 (#ef4444)
- `unknown`: 회색 (#9ca3af)

## 파일 구조

```
src/
├── types/
│   └── kubernetes.ts          # +TopologyNode, TopologyEdge, ServiceTopology
├── lib/
│   └── kubernetes-service.ts  # +getServiceTopology (180줄 추가)
├── hooks/
│   └── useKubernetes.ts       # +useK8sTopology (60줄 추가)
├── components/
│   └── kubernetes/
│       ├── index.ts           # +ServiceTopology export
│       └── ServiceTopology.tsx # React Flow 컴포넌트 (270줄)
└── app/
    └── api/kubernetes/clusters/[clusterId]/
        └── topology/
            └── route.ts       # Topology API (75줄)
```

## UI 플로우

```
/admin/kubernetes → 클러스터 선택 → Topology 탭
                                    ├── 헤더: Service/Deployment/Pod 카운트
                                    ├── React Flow 그래프
                                    │   ├── 노드: 커스텀 컴포넌트 (아이콘 + 이름 + 상태)
                                    │   ├── 엣지: 애니메이션 화살표
                                    │   ├── MiniMap: 전체 뷰
                                    │   └── Controls: 줌/팬
                                    └── 새로고침 버튼
```

## 빌드 검증

```
✓ Compiled successfully in 8.0s
Route: ƒ /api/kubernetes/clusters/[clusterId]/topology
```

## 다음 단계

- Phase 42: DevOps Home - 통합 DevOps 대시보드 홈 (마지막 Phase)

## Sources

- [React Flow (XyFlow)](https://reactflow.dev/)
- [NPM Trends: react-flow vs d3.js](https://npmtrends.com/d3.js-vs-react-flow-vs-react-graph-vis)

---
*Completed: 2026-01-16*
