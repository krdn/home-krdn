---
phase: 36-log-aggregation
plan: 02
subsystem: infra
tags: [docker, log-collector, streaming, websocket]

# Dependency graph
requires:
  - phase: 36-01
    provides: LogEntry Zod 스키마, LogStorage 서비스
provides:
  - DockerLogCollector 클래스 (Docker socket 로그 스트리밍)
  - LogCollectorManager Docker 수집기 관리
  - 8바이트 헤더 파싱 함수
affects: [37-log-viewer, 38-log-realtime]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Docker socket HTTP streaming (follow=true)"
    - "EventEmitter 패턴 로그 전달"
    - "8바이트 헤더 파싱 (stdout/stderr 분리)"

key-files:
  created:
    - src/lib/log-collector/docker-collector.ts
  modified:
    - src/lib/log-collector/index.ts

key-decisions:
  - "기존 docker.ts 패턴 재사용 (DOCKER_SOCKET 환경변수)"
  - "stderr를 warn으로 기본 매핑, 에러 키워드 감지 시 error/fatal"
  - "moduleLogger 사용으로 console.log 대체"

patterns-established:
  - "LogCollector 인터페이스: source, start(), stop(), on('log'|'error')"
  - "Docker 로그 헤더 파싱: parseDockerLogStream()"

# Metrics
duration: 10min
completed: 2026-01-16
---

# Phase 36 Plan 02: Log Collectors Summary

**Docker socket 기반 컨테이너 로그 실시간 수집기 구현, LogCollectorManager 통합**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-16T13:00:00Z
- **Completed:** 2026-01-16T13:10:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Docker 컨테이너 로그 실시간 스트리밍 수집 (follow=true)
- 8바이트 헤더 파싱으로 stdout/stderr 분리
- ISO 타임스탬프 파싱 지원
- LogCollectorManager에 Docker 수집기 관리 기능 통합
- 배치 버퍼링으로 LogStorage 저장 성능 최적화

## Task Commits

각 태스크를 원자적으로 커밋:

1. **Task 1: DockerLogCollector 클래스 구현** - `d107508` (feat)
2. **Task 2: LogCollectorManager 통합** - `d01ad87` (feat)

## Files Created/Modified

- `src/lib/log-collector/docker-collector.ts` - Docker 로그 스트리밍 수집기 클래스
- `src/lib/log-collector/index.ts` - LogCollectorManager에 Docker 수집기 관리 추가

## Decisions Made

1. **기존 docker.ts 패턴 재사용**: DOCKER_SOCKET 환경변수, http.request 패턴 동일하게 적용
2. **stderr 레벨 매핑**: stderr 출력을 warn으로 기본 매핑, error/fatal 키워드 감지 시 레벨 상향
3. **moduleLogger 마이그레이션**: console.log/error 대신 pino 기반 moduleLogger 사용
4. **EventEmitter 패턴**: 콜백 대신 on('log'|'error') 이벤트 패턴으로 로그 전달

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - 기존 file-collector.ts와 index.ts가 이미 존재하여 Docker 수집기만 추가 통합.

## User Setup Required

None - Docker socket 접근 권한은 기존 환경에서 이미 설정됨.

## Next Phase Readiness

- DockerLogCollector로 컨테이너 로그 수집 가능
- Phase 37 (Log Viewer UI)에서 로그 목록 조회/검색 UI 구현 예정
- Phase 38 (Log Realtime)에서 WebSocket 실시간 스트리밍 구현 예정

---
*Phase: 36-log-aggregation*
*Completed: 2026-01-16*
