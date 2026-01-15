---
phase: 21-team-features
plan: 03
subsystem: ui
tags: [react-query, zustand, framer-motion, team-ui]

requires:
  - phase: 21-01
    provides: Team API 엔드포인트
  - phase: 21-02
    provides: TeamInvite API 및 서비스
provides:
  - 팀 관련 React Query 훅 (useTeams.ts)
  - 팀 선택 Zustand 스토어 (teamStore.ts)
  - 팀 목록/생성/상세 페이지
  - 팀 UI 컴포넌트 (TeamCard, TeamMemberList, InviteModal)
affects: [21-04, phase-22]

tech-stack:
  added: [framer-motion]
  patterns: [React Query mutation with invalidation, Zustand persist middleware]

key-files:
  created:
    - src/hooks/useTeams.ts
    - src/stores/teamStore.ts
    - src/app/teams/page.tsx
    - src/app/teams/new/page.tsx
    - src/app/teams/[teamId]/page.tsx
    - src/app/teams/invite/[token]/page.tsx
    - src/components/teams/TeamCard.tsx
    - src/components/teams/TeamMemberList.tsx
    - src/components/teams/InviteModal.tsx
  modified: []

key-decisions:
  - "framer-motion 도입으로 팀 카드 및 목록 애니메이션 구현"
  - "Zustand persist로 현재 선택된 팀 ID를 localStorage에 유지"
  - "초대 수락 페이지 별도 구현으로 비로그인 사용자도 초대 정보 확인 가능"

patterns-established:
  - "팀 관련 쿼리 키 패턴: ['teams'], ['team', id], ['team-members', id], ['team-invites', id]"
  - "mutation 성공 시 관련 쿼리 자동 invalidation"

issues-created: []

duration: 15min
completed: 2026-01-15
---

# Phase 21-03: Team Management UI Summary

**React Query 훅 10개 + Zustand 스토어 + 팀 목록/생성/상세 페이지 + 멤버 관리 컴포넌트 + 초대 모달 UI 구현**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-15T01:05:00Z
- **Completed:** 2026-01-15T01:20:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- useTeams.ts: 팀 관련 React Query 훅 10개 구현 (CRUD, 멤버, 초대)
- teamStore.ts: Zustand 스토어로 현재 선택된 팀 관리 (localStorage persist)
- 팀 목록 페이지: 카드 그리드 레이아웃, 빈 상태 UI
- 팀 생성 페이지: 이름/설명 입력 폼
- 팀 상세 페이지: 팀 정보, 멤버 목록, 인라인 수정, 삭제 기능
- 초대 수락 페이지: 비로그인 상태에서도 초대 정보 확인 가능
- TeamCard: Framer Motion 호버 애니메이션
- TeamMemberList: 역할 변경 드롭다운, 멤버 제거 기능
- InviteModal: 이메일 초대, 역할 선택, 대기 중인 초대 관리

## Task Commits

1. **Task 1: Team React Query 훅 및 Zustand 스토어** - `776f87c` (feat)
2. **Task 2: 팀 페이지 및 컴포넌트** - `729eb65` (feat)

**Plan metadata:** [pending]

## Files Created/Modified

- `src/hooks/useTeams.ts` - 팀 관련 React Query 훅
- `src/stores/teamStore.ts` - 팀 선택 Zustand 스토어
- `src/app/teams/page.tsx` - 팀 목록 페이지
- `src/app/teams/new/page.tsx` - 팀 생성 페이지
- `src/app/teams/[teamId]/page.tsx` - 팀 상세 페이지
- `src/app/teams/invite/[token]/page.tsx` - 초대 수락 페이지
- `src/components/teams/TeamCard.tsx` - 팀 카드 컴포넌트
- `src/components/teams/TeamMemberList.tsx` - 멤버 목록 컴포넌트
- `src/components/teams/InviteModal.tsx` - 초대 모달 컴포넌트

## Decisions Made

- **framer-motion 도입**: 기존 프로젝트에 없었으나 팀 UI 애니메이션을 위해 추가
- **Zustand persist**: 새로고침 후에도 선택된 팀 유지를 위해 localStorage 연동
- **초대 수락 페이지 분리**: 비로그인 사용자도 초대 정보 확인 후 로그인 유도 가능

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] framer-motion 패키지 설치**
- **Found during:** Task 2 (컴포넌트 빌드)
- **Issue:** framer-motion이 설치되어 있지 않아 빌드 실패
- **Fix:** npm install framer-motion 실행
- **Files modified:** package.json, package-lock.json
- **Verification:** npm run build 성공
- **Committed in:** 729eb65 (Task 2 커밋에 포함)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** framer-motion 추가로 애니메이션 기능 정상 동작

## Issues Encountered

None

## Next Step

Ready for 21-04-PLAN.md (Team Notification Channel)

---
*Phase: 21-team-features*
*Completed: 2026-01-15*
