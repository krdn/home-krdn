# Phase 19-01 Summary: RBAC 권한 매트릭스 및 미들웨어 통합

## Overview
Phase 18에서 구축한 역할 시스템을 확장하여 RBAC(Role-Based Access Control) 기반의 세분화된 접근 제어를 구현했습니다.

## Completed Tasks

### Task 1: RBAC 권한 매트릭스 및 헬퍼 함수 구현
**Commit:** add2f25

**파일 수정:**
- `src/types/auth.ts` - RBAC 타입 추가
  - `Resource`: 리소스 종류 (system, docker, projects, users, admin)
  - `Action`: 액션 종류 (read, write, delete, manage)
  - `Permission`, `RolePermissions`: 권한 정의 타입

- `src/lib/rbac.ts` - 신규 생성
  - `ROLE_PERMISSIONS` 권한 매트릭스 상수
  - `hasPermission(role, resource, action)`: 권한 확인 함수
  - `canAccessRoute(role, pathname, method)`: 경로 접근 가능 여부 확인
  - `getAllowedActions(role, resource)`: 허용된 액션 목록 반환
  - `findMinimumRequiredRole(resource, action)`: 최소 필요 역할 계산
  - `isRoleAtLeast(role, requiredRole)`: 역할 계층 비교

### Task 2: 미들웨어 RBAC 통합 및 경로별 권한 검사 강화
**Commit:** 232818a

**파일 수정:**
- `src/middleware.ts` - RBAC 기반 권한 검사 적용
  - `canAccessRoute` 함수 import 및 적용
  - 기존 하드코딩 admin 검사를 RBAC 기반으로 교체
  - 경로 + HTTP 메서드별 세분화된 권한 검사
  - 403 응답에 상세 권한 정보 포함

## Permission Matrix

| 역할 | system | docker | projects | users | admin |
|------|--------|--------|----------|-------|-------|
| admin | 모든 액션 | 모든 액션 | 모든 액션 | 모든 액션 | 모든 액션 |
| user | read | read, write | read, write | - | - |
| viewer | read | read | read | - | - |

## Route Permission Mapping

| 경로 | GET (read) | POST/PUT (write) | DELETE |
|------|------------|------------------|--------|
| /api/system/* | viewer+ | admin | admin |
| /api/docker/* | viewer+ | user+ | user+ |
| /api/projects/* | viewer+ | user+ | user+ |
| /api/admin/* | admin | admin | admin |
| /admin/* | admin | admin | admin |

## Key Design Decisions

1. **Edge Runtime 호환**: `rbac.ts`는 순수 TypeScript로 구현하여 Next.js Edge Runtime에서 동작

2. **HTTP 메서드 → 액션 매핑**:
   - GET, HEAD, OPTIONS → read
   - POST, PUT, PATCH → write
   - DELETE → delete

3. **403 응답 개선**: 권한 부족 시 필요 정보 제공
   ```json
   {
     "error": "권한이 부족합니다...",
     "code": "FORBIDDEN",
     "requiredRole": "user",
     "resource": "docker",
     "action": "write"
   }
   ```

4. **lowercase 역할 유지**: JWT 호환성을 위해 `admin`, `user`, `viewer` 형식 유지

## Files Modified
- `src/types/auth.ts` (수정)
- `src/lib/rbac.ts` (생성)
- `src/middleware.ts` (수정)

## Verification
- [x] `npx tsc --noEmit` 타입 체크 통과
- [x] src/lib/rbac.ts 파일 존재 및 함수들 export 확인
- [x] 미들웨어에서 canAccessRoute 사용 확인
- [x] VIEWER/USER/ADMIN 역할별 권한 분리 구현

## Success Criteria Met
- [x] 권한 매트릭스(ROLE_PERMISSIONS) 정의됨
- [x] hasPermission, canAccessRoute 헬퍼 함수 구현됨
- [x] 미들웨어에서 경로 + HTTP 메서드별 권한 검사 동작
- [x] 타입스크립트 에러 없음
