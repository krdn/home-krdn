# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** 통합 모니터링 허브 — 모든 서비스와 컨테이너를 한눈에 파악하고 관리하는 중앙 대시보드
**Current focus:** Milestone v1.1 Enhancement — WebSocket 실시간 업데이트, 외부 알림, Admin 기능

## Current Position

Phase: 14 of 16 (Project Admin CRUD) ✅ Complete
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-15 — Completed 14-01-PLAN.md

Progress: ██████░░░░ 44% (7/16 plans estimated)

## Performance Metrics

**Velocity:**
- Milestone v1.0: 24 plans completed in ~60min (parallelized)
- Current milestone: Not started

**By Phase (v1.1):**

| Phase | Plans | Completed | Status |
|-------|-------|-----------|--------|
| 9. WebSocket Infrastructure | 2 | 2 | ✅ Complete |
| 10. Real-time Metrics | 1 | 1 | ✅ Complete |
| 11. Real-time Containers | 1 | 1 | ✅ Complete |
| 12. Email Notification | 1 | 1 | ✅ Complete |
| 13. Slack Integration | 1 | 1 | ✅ Complete |
| 14. Project Admin CRUD | 1 | 1 | ✅ Complete |
| 15. Admin Dashboard | ? | 0 | Not started |
| 16. E2E Testing | ? | 0 | Not started |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- jose over jsonwebtoken (Edge Runtime 호환성)
- bcryptjs for pure JS password hashing
- 15-minute JWT expiry with httpOnly cookies
- Zod for runtime type validation (Docker API)
- Centralized constants in src/config/constants.ts
- React Query for data fetching
- Dynamic Import for bundle optimization
- Zustand persist for alert rules state
- Radix Toast + Browser Notification API for alerts
- ws + next-ws for WebSocket (09-01)
- Zod discriminatedUnion for WebSocket message types (09-01)
- Exponential backoff for WebSocket reconnection (09-02)
- 서버 시작 시 무조건 브로드캐스트 (구독자 체크 없이 단순 구현) (10-01)
- WebSocket fallback to polling 기본 활성화 (10-01)
- WSContainersData에 image, ports, created 포함 (ContainerData와 동일) (11-01)
- 컨테이너 액션 후 500ms 지연 뒤 전체 브로드캐스트 (11-01)
- getLogs는 HTTP API 유지 (로그 대용량으로 WebSocket 비적합) (11-01)
- Resend API 선택 (개발자 친화적, Edge Runtime 호환) (12-01)
- Critical 알림만 기본 이메일 발송 (사용자 피로도 고려) (12-01)
- 인메모리 쿨다운 + 일일 발송 제한 50건 (안전장치) (12-01)
- Native fetch for Slack webhook (SDK 불필요) (13-01)
- Slack Block Kit 메시지 포맷 (시각적으로 풍부한 알림) (13-01)
- Webhook URL 클라이언트 저장 (서버 환경변수 불필요) (13-01)
- JSON 파일 저장 방식 (DB 대신 심플한 파일 기반) (14-01)
- route-level 인증 체크 (GET public, 쓰기만 인증) (14-01)
- Radix Dialog 인라인 폼 (별도 페이지 없이 빠른 CRUD) (14-01)

### Deferred Issues

None yet.

### Pending Todos

None yet.

### Blockers/Concerns Carried Forward

None — v1.0 MVP completed successfully.

### Roadmap Evolution

- v1.0 MVP completed: 8 phases (1-8), shipped 2026-01-15
- v1.1 Enhancement created: WebSocket + 외부 알림 + Admin, 8 phases (9-16)

## Session Continuity

Last session: 2026-01-15
Stopped at: Phase 14 complete, ready for Phase 15
Resume file: None
