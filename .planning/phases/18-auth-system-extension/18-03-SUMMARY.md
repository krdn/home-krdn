# Phase 18 Plan 03: Role Management Summary

**관리자 전용 역할 관리 API와 미들웨어 역할 검사를 구현하여 Phase 19 RBAC를 준비했습니다.**

## Accomplishments

- [x] 역할 변경 서비스 함수 구현 (updateUserRole, getAllUsers, countUsersByRole)
- [x] 역할 변경 API 엔드포인트 구현 (PATCH /api/admin/users/[id]/role)
- [x] 미들웨어 역할 검사 강화 (/api/admin/* 경로 ADMIN 전용)

## Files Created/Modified

- `src/lib/user-service.ts` - updateUserRole, getAllUsers, countUsersByRole, UpdateRoleInputSchema 추가
- `src/app/api/admin/users/[id]/role/route.ts` - 신규 생성
- `src/middleware.ts` - 역할 검사 로직 추가, matcher에 /api/admin/* 추가

## API Details

### PATCH /api/admin/users/[id]/role

**요청 Body:**
```json
{
  "role": "USER"  // "ADMIN" | "USER" | "VIEWER"
}
```

**응답:**
- 200: `{ success: true, user: { id, username, role } }`
- 400: 유효하지 않은 역할
- 403: 권한 부족 / 자기 변경 / 마지막 관리자
- 404: 사용자 없음
- 500: 서버 오류

**보안 기능:**
- ADMIN만 호출 가능 (미들웨어 + API 이중 검사)
- 자기 자신 역할 변경 방지 (관리자 실수 방지)
- 마지막 ADMIN 강등 방지 (시스템 무관리 상태 방지)

## Decisions Made

1. **이중 역할 검사**: 미들웨어와 API 핸들러에서 모두 ADMIN 역할을 검사합니다. 미들웨어는 빠른 거부를 위해, API는 상세 에러 메시지를 위해 사용합니다.

2. **JWT role 형식 유지**: JWT payload의 role은 기존 lowercase 형식(admin, user, viewer)을 유지합니다. Prisma의 UPPERCASE enum과의 변환은 서비스 레이어에서 처리합니다.

## Issues Encountered

None

## Next Phase Readiness

Phase 18 complete. Ready for Phase 19 (RBAC Access Control)

**Phase 19 준비 상태:**
- 역할 검사 미들웨어 기반 구축됨 (`/api/admin/*` 경로 보호)
- 사용자 역할 변경 인프라 완료 (updateUserRole 함수)
- JWT payload에 role 정보 포함됨
- countUsersByRole 함수로 역할별 사용자 집계 가능
