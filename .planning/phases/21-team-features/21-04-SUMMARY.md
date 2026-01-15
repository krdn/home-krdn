---
phase: 21-team-features
plan: 04
subsystem: notification
tags: [prisma, alertEngine, slack, email, react-query]

requires:
  - phase: 21-03
    provides: Team UI 컴포넌트 및 페이지
provides:
  - TeamSettings Prisma 모델
  - 팀 설정 API (/api/teams/[teamId]/settings)
  - alertEngine 팀 알림 채널 함수
  - TeamSettingsPanel UI 컴포넌트
  - useTeamSettings React Query 훅
affects: [phase-22]

tech-stack:
  added: []
  patterns: [upsert pattern for settings, Promise.allSettled for parallel notification]

key-files:
  created:
    - prisma/migrations/20260115034326_add_team_settings/migration.sql
    - src/app/api/teams/[teamId]/settings/route.ts
    - src/components/teams/TeamSettingsPanel.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/team-service.ts
    - src/lib/alertEngine.ts
    - src/hooks/useTeams.ts
    - src/app/teams/[teamId]/page.tsx

key-decisions:
  - "upsert 패턴으로 팀 설정 조회 시 기본값 자동 생성"
  - "Promise.allSettled로 이메일/Slack 병렬 발송 (한 채널 실패가 다른 채널에 영향 X)"
  - "알림 타입별 설정 플래그로 세밀한 알림 제어"

patterns-established:
  - "팀 설정 쿼리 키 패턴: ['team-settings', teamId]"
  - "TeamNotificationType: 'alert' | 'member_join' | 'member_leave'"

issues-created: []

duration: 20min
completed: 2026-01-15
---

# Phase 21-04: Team Notification Channel Summary

**TeamSettings 모델 + 팀 설정 API + alertEngine 팀 채널 확장 + TeamSettingsPanel UI 구현**

## Performance

- **Duration:** 20 min
- **Started:** 2026-01-15T03:40:00Z
- **Completed:** 2026-01-15T04:00:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- TeamSettings Prisma 모델 추가 (알림 채널 및 대상 설정)
- 팀 설정 API (GET/PATCH) 구현 - 멤버 조회, ADMIN 수정 권한
- alertEngine에 sendTeamNotification 함수 추가
- TeamSettingsPanel 모달 컴포넌트 구현
- useTeamSettings, useUpdateTeamSettings 훅 추가
- 팀 상세 페이지에 설정 버튼 추가

## Task Commits

1. **Task 1: TeamSettings 모델 및 설정 API** - `bd7aa45` (feat)
2. **Task 2: 팀 알림 채널 및 설정 UI** - `dd67434` (feat)

**Plan metadata:** [pending]

## Files Created/Modified

- `prisma/schema.prisma` - TeamSettings 모델 추가
- `prisma/migrations/20260115034326_add_team_settings/migration.sql` - 마이그레이션
- `src/lib/team-service.ts` - 설정 조회/업데이트 함수, DTO
- `src/lib/alertEngine.ts` - sendTeamNotification 함수 추가
- `src/app/api/teams/[teamId]/settings/route.ts` - 설정 API
- `src/hooks/useTeams.ts` - useTeamSettings 훅 추가
- `src/components/teams/TeamSettingsPanel.tsx` - 설정 UI 컴포넌트
- `src/app/teams/[teamId]/page.tsx` - 설정 버튼 추가

## Decisions Made

- **upsert 패턴 적용**: 설정 조회 시 없으면 기본값으로 자동 생성
- **병렬 알림 발송**: Promise.allSettled로 이메일/Slack 독립 발송
- **알림 타입 분리**: alert, member_join, member_leave 각각 개별 토글

## Issues Encountered

None

## Phase 21 Complete

Phase 21 Team Features 전체 완료. 다음: Phase 22 PWA Foundation

---
*Phase: 21-team-features*
*Completed: 2026-01-15*
