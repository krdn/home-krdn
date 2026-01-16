# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** 통합 모니터링 허브 — 모든 서비스와 컨테이너를 한눈에 파악하고 관리하는 중앙 대시보드
**Current focus:** v2.2 DevOps Tools — CI/CD, 로그 관리, K8s 지원, 포트 레지스트리

## Current Position

Phase: 37 of 42 (Log Viewer UI)
Plan: 3 of 3 complete
Status: ⏸️ Checkpoint 대기 (사용자 검증)
Last activity: 2026-01-16 — Completed 37-03-PLAN.md (LogViewer + Admin Page)

Progress: █████░░░░░ 48% (v2.2 Milestone — Phase 33-37 complete)

## Performance Metrics

**Velocity:**
- Milestone v1.0: 24 plans completed in ~60min (parallelized)
- Milestone v1.1: 9 plans completed in ~7hrs
- Milestone v2.0: 17 plans completed
- Phase 34: 2 plans completed in ~15min
- Phase 35: 2 plans completed in ~9min (5min + 4min)
- Phase 36: 3 plans completed in ~30min (8min + 10min + 12min)
- Phase 37-01: ~4min
- Phase 37-02: ~8min
- Phase 37-03: ~6min

**By Milestone:**

| Milestone | Phases | Plans | Status | Completed |
|-----------|--------|-------|--------|-----------|
| v1.0 MVP | 1-8 | 24 | ✅ Shipped | 2026-01-15 |
| v1.1 Enhancement | 9-16 | 9 | ✅ Shipped | 2026-01-15 |
| v2.0 Multi-User Foundation | 17-24 | 17 | ✅ Shipped | 2026-01-15 |
| v2.1 Polish | 25-32 | 10 | ✅ Shipped | 2026-01-15 |
| v2.2 DevOps Tools | 33-42 | 5+ | 🚧 In Progress | - |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key technology decisions for v2.1:

- ✅ 테스트 커버리지: 핵심 lib 모듈 고커버리지 달성 (rbac 97%, auth 78%, services 100%)
- 전체 threshold는 UI 컴포넌트 포함으로 점진적 상향
- ✅ E2E 테스트: 67개 테스트 케이스, 다중 브라우저 지원 (Chromium, Firefox, Webkit)
- ✅ 중앙집중식 에러 핸들링: 7개 에러 클래스, 17개 에러 코드, 60개 테스트
- ✅ WCAG 기반 접근성 개선: ARIA 속성 50+, 포커스 트랩, 스킵 링크, reduced-motion 지원
- ✅ 프로덕션 로깅: pino 선택 (성능, JSON 기본, 작은 번들)

Key technology decisions for v2.2:
- ✅ Phase 33: PortRegistry 모델, 포트 관리 API, Admin UI 완성
- ✅ Phase 34: Octokit SDK로 GitHub REST API 연동
  - GitHubSettings Prisma 모델 (User 1:1 관계)
  - 11개 서비스 함수 (Settings CRUD, 레포/커밋/워크플로우 조회)
  - 7개 REST API 라우트
  - DTO 패턴으로 토큰 값 미노출 (hasToken boolean만)
- ✅ Phase 35: GitHub CI/CD Dashboard 완성
  - useWorkflows, useWorkflowRuns 훅 (자동 새로고침)
  - WorkflowStatusBadge 상태 시각화 (6가지 상태)
  - WorkflowList, WorkflowRunList 컴포넌트
  - /admin/github 워크플로우 대시보드 (2컬럼 레이아웃)
- ✅ Phase 36: 로그 수집 백엔드 완성
  - 36-01: LogEntry Zod 스키마, Prisma 모델, LogStorage 서비스
  - 36-02: DockerLogCollector 클래스 (Docker socket 스트리밍)
  - 36-03: FileLogCollector (node-tail), WebSocket 로그 채널
  - LogCollectorManager 통합, 100ms 버퍼링 배치 전송
- ✅ Phase 37: Log Viewer UI 완료
  - 37-01: 로그 조회 REST API 2개, useLogs/useLogStats 훅
  - 37-02: useLogStream 훅 (WebSocket), LogFilter/LogEntry/LogList 컴포넌트
  - 37-03: LogViewer 통합 컴포넌트, LogStats 컴포넌트, Admin 로그 페이지 교체
- 토큰 암호화: 현재 평문 저장, 향후 암호화 고려

### Constraints (v2.2)

- 외부 API (GitHub, K8s) 연동 시 인증 정보 안전 관리
- 로그 데이터 저장 시 디스크 용량 고려 (로테이션 필수)
- 기존 모니터링 기능과 일관된 UX 유지
- Research 필요 Phase(36, 39, 41)는 planning 전 조사 선행

### Deferred Issues

None.

### Pending Todos

None.

### Blockers/Concerns Carried Forward

1. **/login 페이지 빌드 에러**: untracked 파일, useSearchParams Suspense 에러, 별도 수정 필요

### Roadmap Evolution

- v1.0 MVP completed: 8 phases (1-8), shipped 2026-01-15
- v1.1 Enhancement completed: 8 phases (9-16), shipped 2026-01-15
- v2.0 Multi-User Foundation completed: 8 phases (17-24), shipped 2026-01-15
- v2.1 Polish completed: 8 phases (25-32), shipped 2026-01-15
- v2.2 DevOps Tools: 10 phases (33-42), Phase 33-37 complete

## Session Continuity

Last session: 2026-01-16 14:30 UTC
Stopped at: Completed 37-03-PLAN.md (LogViewer + Admin Page) - Checkpoint 대기
Resume file: None
Next action: Checkpoint - 사용자 검증 후 Phase 38 진행
