# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** 통합 모니터링 허브 — 모든 서비스와 컨테이너를 한눈에 파악하고 관리하는 중앙 대시보드
**Current focus:** v2.0 Multi-User Foundation — 멀티 유저 인프라 + PWA 모바일 경험

## Current Position

Phase: 20 of 24 (User Dashboard Settings)
Plan: 3 of 3 complete
Status: Phase complete
Last activity: 2026-01-15 — Completed Phase 20 (20-01, 20-02, 20-03)

Progress: ████░░░░░░ 50% (v2.0 Phase 20 complete)

## Performance Metrics

**Velocity:**
- Milestone v1.0: 24 plans completed in ~60min (parallelized)
- Milestone v1.1: 9 plans completed in ~7hrs

**By Milestone:**

| Milestone | Phases | Plans | Status | Completed |
|-----------|--------|-------|--------|-----------|
| v1.0 MVP | 1-8 | 24 | ✅ Shipped | 2026-01-15 |
| v1.1 Enhancement | 9-16 | 9 | ✅ Shipped | 2026-01-15 |
| v2.0 Multi-User Foundation | 17-24 | TBD | 🚧 In Progress | - |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key technology decisions for v2.0:

- Prisma 7 ORM with better-sqlite3 어댑터 (타입 안전성, 마이그레이션)
- SQLite 파일 DB로 시작 (마이그레이션 용이)
- Role enum으로 ADMIN/USER/VIEWER 구분
- UserSettings 1:1 분리 (대시보드 커스터마이징 준비)
- 싱글톤 PrismaClient 패턴 (Next.js hot reload 대응)
- authenticateUser vs authenticateUserFromDB 병행 운영 (점진적 전환)
- 이중 역할 검사: 미들웨어(빠른 거부) + API(상세 에러)
- JWT role lowercase 형식 유지 (Prisma enum과 서비스 레이어에서 변환)
- RBAC 권한 매트릭스: Resource(system/docker/projects/users/admin) × Action(read/write/delete/manage)
- Edge Runtime 호환 RBAC 헬퍼: hasPermission, canAccessRoute (순수 TS)
- 프론트엔드 역할 기반 UI: useAuth 훅 + RoleGuard 컴포넌트
- UserSettings 서비스: settings-service.ts + /api/settings API
- 테마 서버 동기화: 로그인 시 서버, 비로그인 시 localStorage
- 대시보드 위젯 커스터마이징: Zustand 스토어 + dashboardLayout JSON 서버 저장

### Constraints (v2.0)

- 기존 JWT 인증 시스템과 호환 유지
- v1.1의 WebSocket 인프라 활용
- 단계적 마이그레이션 (기존 단일 유저 → 멀티 유저)

### Deferred Issues

None.

### Pending Todos

None.

### Blockers/Concerns Carried Forward

None — Starting fresh milestone v2.0.

### Roadmap Evolution

- v1.0 MVP completed: 8 phases (1-8), shipped 2026-01-15
- v1.1 Enhancement completed: 8 phases (9-16), shipped 2026-01-15
- v2.0 Multi-User Foundation created: 8 phases (17-24), in progress

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed Phase 20 User Dashboard Settings
Resume file: None
Next action: `/gsd:plan-phase 21` (Team Features)
