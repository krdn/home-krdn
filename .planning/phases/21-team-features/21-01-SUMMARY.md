# Phase 21-01: Team Service & API Summary

**팀 서비스 레이어와 REST API 엔드포인트를 구현하여 팀 CRUD 및 멤버 관리 기반 구축**

## Accomplishments

- `team-service.ts` 서비스 레이어 구현 (TeamDto, TeamMemberDto 타입 포함)
- Zod 검증 스키마: CreateTeamInput, UpdateTeamInput, AddMemberInput
- 팀 CRUD 함수: createTeam, getTeamById, getTeamBySlug, updateTeam, deleteTeam, getUserTeams
- 멤버 관리 함수: addTeamMember, removeTeamMember, updateMemberRole, getTeamMembers
- 권한 헬퍼 함수: isTeamMember, isTeamOwner, hasTeamAdminAccess, getMemberRole
- slug 자동 생성 함수 (kebab-case, 중복 시 숫자 suffix)
- 3개 REST API 라우트 구현 (/api/teams, /api/teams/[teamId], /api/teams/[teamId]/members)

## Files Created/Modified

- `src/lib/team-service.ts` - 팀 CRUD 서비스 레이어 (597줄)
- `src/app/api/teams/route.ts` - 팀 목록/생성 API (GET, POST)
- `src/app/api/teams/[teamId]/route.ts` - 팀 상세/수정/삭제 API (GET, PATCH, DELETE)
- `src/app/api/teams/[teamId]/members/route.ts` - 멤버 관리 API (GET, POST, DELETE)

## Decisions Made

1. **slug 생성 방식**: 팀 이름에서 kebab-case 변환, 한글 지원, 중복 시 숫자 suffix 추가
2. **팀 생성 시 자동 멤버 추가**: 소유자가 자동으로 ADMIN 역할로 팀 멤버에 추가됨
3. **권한 계층**:
   - GET 조회: 팀 멤버만 접근 가능
   - PATCH 수정: 소유자 또는 ADMIN 멤버만 가능
   - DELETE 팀 삭제: 소유자만 가능
   - DELETE 멤버 제거: ADMIN이 타인 제거, 일반 멤버는 본인만 탈퇴 가능
4. **소유자 보호**: 팀 소유자는 멤버에서 제거될 수 없음 (팀 삭제 또는 소유권 이전 필요)
5. **API 응답 형식**: `{ success: boolean, data?: T, error?: string, code?: string }`

## Issues Encountered

- 기존 테스트 파일(`route.test.ts`)에 타입 에러가 있었으나 이는 Phase 21-01 작업과 무관한 이전 이슈
- `npm run build` 성공 확인으로 타입 안전성 검증 완료

## API Summary

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/teams` | GET | 내 팀 목록 | 인증 |
| `/api/teams` | POST | 팀 생성 | 인증 |
| `/api/teams/[teamId]` | GET | 팀 상세 | 멤버 |
| `/api/teams/[teamId]` | PATCH | 팀 수정 | ADMIN |
| `/api/teams/[teamId]` | DELETE | 팀 삭제 | 소유자 |
| `/api/teams/[teamId]/members` | GET | 멤버 목록 | 멤버 |
| `/api/teams/[teamId]/members` | POST | 멤버 추가 | ADMIN |
| `/api/teams/[teamId]/members` | DELETE | 멤버 제거 | ADMIN/본인 |

## Next Step

Ready for 21-02-PLAN.md (Team Invite System)
