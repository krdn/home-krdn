---
phase: 36-log-aggregation
plan: 01
subsystem: logging
tags: [prisma, zod, log-aggregation, docker, journal]

# Dependency graph
requires:
  - phase: 34-github-integration
    provides: Prisma 서비스 패턴, GitHub 연동 아키텍처
provides:
  - LogEntry Zod 스키마 및 TypeScript 타입
  - Prisma LogEntry 데이터베이스 모델
  - LogStorage 서비스 (CRUD, 배치 저장, 통계, retention)
affects: [36-02-log-collectors, 37-log-viewer-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod 스키마 기반 로그 타입 정의"
    - "Prisma 모델 기반 로그 저장소"
    - "서비스 클래스 + 싱글톤 패턴"

key-files:
  created:
    - src/types/log.ts
    - src/lib/log-storage.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "LogLevel 6단계: trace, debug, info, warn, error, fatal"
  - "LogSource 3종류: docker, journal, app"
  - "metadata는 JSON string으로 저장 (SQLite 호환)"
  - "기본 retention 7일"

patterns-established:
  - "로그 통합 스키마: 모든 소스(Docker/Journal/App) 동일 형식"
  - "LogStorage 서비스: Prisma 기반 로그 CRUD 추상화"

# Metrics
duration: 8min
completed: 2026-01-16
---

# Phase 36 Plan 01: Log Aggregation Infrastructure Summary

**Zod 기반 로그 타입 + Prisma LogEntry 모델 + LogStorage 서비스로 로그 수집 기반 구축**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-16T12:31:00Z
- **Completed:** 2026-01-16T12:39:00Z
- **Tasks:** 3 (Task 1은 이전 커밋에서 완료됨)
- **Files modified:** 3

## Accomplishments

- LogEntry Zod 스키마 정의 (LogLevel, LogSource, LogEntrySchema, LogQuerySchema)
- Prisma LogEntry 모델 추가 및 DB 동기화 (4개 인덱스)
- LogStorage 서비스 구현 (write, writeBatch, query, cleanup, getStats)

## Task Commits

각 태스크는 원자적으로 커밋되었습니다:

1. **Task 1: 로그 타입 정의 (Zod 스키마)** - `9a393cf` (feat) - 이전 세션에서 완료
2. **Task 2: Prisma LogEntry 모델 추가** - `48a6091` (feat)
3. **Task 3: LogStorage 서비스 구현** - `78f1ddd` (feat)

## Files Created/Modified

- `src/types/log.ts` - Zod 스키마, 타입, 헬퍼 함수 (LogLevel, LogSource, LogEntrySchema, LogQuerySchema)
- `prisma/schema.prisma` - LogEntry 모델 추가 (source, sourceId, level, message, timestamp, metadata)
- `src/lib/log-storage.ts` - LogStorage 서비스 클래스 및 싱글톤 인스턴스

## Decisions Made

1. **로그 레벨 6단계**: pino/bunyan 표준 따름 (trace, debug, info, warn, error, fatal)
2. **로그 소스 3종류**: docker (컨테이너), journal (systemd), app (애플리케이션)
3. **metadata JSON string**: SQLite JSONB 미지원으로 문자열 저장 후 parse
4. **기본 retention 7일**: cleanup() 메서드로 보존 기간 초과 로그 삭제
5. **인덱스 4개**: source+timestamp, level+timestamp, timestamp, sourceId (조회 최적화)

## Deviations from Plan

None - 플랜대로 정확히 실행됨.

Note: Task 1은 이전 세션(`9a393cf`)에서 이미 커밋되어 있었음.

## Issues Encountered

1. **Prisma 마이그레이션 드리프트**: Phase 33-34에서 추가된 테이블들이 마이그레이션 없이 생성되어 있어 `prisma db push`로 해결함. 개발 환경이므로 데이터 손실 없이 스키마 동기화 완료.

## User Setup Required

None - 외부 서비스 설정 필요 없음.

## Next Phase Readiness

- LogStorage 서비스 준비 완료
- 36-02에서 Docker, Journal 로그 수집기 구현 예정
- 37에서 로그 뷰어 UI 구현 예정
- Phase 36-02 바로 진행 가능

---
*Phase: 36-log-aggregation*
*Completed: 2026-01-16*
