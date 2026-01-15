# Phase 19-02 Summary: API 및 프론트엔드 RBAC 적용

## 완료 일시
2026-01-15

## 목표
기존 API 라우트에 RBAC 역할 검사를 적용하고, 프론트엔드에서 역할 기반 UI 조건부 렌더링을 구현합니다.

## 완료된 작업

### Task 1: API 라우트에 RBAC 역할 검사 적용
- Docker 컨테이너 [id] API에 user 이상 권한 검사 추가 (start/stop/restart)
- Projects API POST에 user 이상 권한 검사 추가
- Projects [id] API PUT에 user 이상 권한 검사 추가
- Projects [id] API DELETE에 admin 권한 검사 추가
- 403 에러 시 한국어 상세 메시지 포함
- 커밋: `1b0f4a6`

### Task 2: 프론트엔드 역할 기반 UI 구현
- `useAuth` 훅 생성: 세션 정보, hasPermission, isAdmin/isUser/isViewer 제공
- `RoleGuard` 컴포넌트 생성: 역할 기반 조건부 렌더링
- `AdminOnly`, `UserOnly`, `PermissionGuard` 편의 컴포넌트 추가
- React Query 기반 세션 캐싱 및 자동 재검증 지원
- 커밋: `5628b5a`

### Task 3: 역할 기반 UI 적용 및 통합 검증
- Admin 대시보드 헤더에 `RoleBanner` 컴포넌트 추가 (역할 표시)
- `ContainerList`에서 user 이상만 컨테이너 제어 버튼 표시
- `npm run build` 검증 통과
- 커밋: `dc500f4`

## 생성/수정된 파일

### 신규 생성
- `src/hooks/useAuth.ts` - 인증 및 권한 관리 훅
- `src/components/admin/RoleGuard.tsx` - 역할 기반 조건부 렌더링 컴포넌트
- `src/components/admin/RoleBanner.tsx` - 역할 표시 배너 컴포넌트

### 수정
- `src/app/api/docker/containers/[id]/route.ts` - RBAC 권한 검사 추가
- `src/app/api/projects/route.ts` - RBAC 권한 검사 추가
- `src/app/api/projects/[id]/route.ts` - RBAC 권한 검사 추가
- `src/app/admin/page.tsx` - RoleBanner 추가
- `src/components/admin/ContainerList.tsx` - 역할 기반 버튼 표시

## 검증 결과
- [x] `npm run build` 성공
- [x] API 라우트에 hasPermission 검사 적용 확인
- [x] useAuth 훅에 권한 메서드 추가 확인
- [x] RoleGuard 컴포넌트 존재 확인
- [x] Admin 페이지 및 ContainerList에 역할 기반 UI 적용 확인

## 권한 매트릭스 적용 현황

| 리소스 | 액션 | 필요 역할 | 적용 위치 |
|--------|------|-----------|-----------|
| docker | write | user 이상 | containers/[id] POST |
| projects | write | user 이상 | projects POST, [id] PUT |
| projects | delete | admin | projects/[id] DELETE |

## 다음 단계
- 19-03 (있다면): 추가 RBAC 기능 구현 또는 Phase 20 진행
