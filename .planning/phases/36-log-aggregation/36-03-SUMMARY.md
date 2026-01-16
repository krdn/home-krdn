---
phase: 36-log-aggregation
plan: 03
subsystem: infra
tags: [websocket, streaming, real-time, logging, tail]

requires:
  - phase: 36-01
    provides: LogEntrySchema, LogStorage, isLogLevelAtLeast
  - phase: 36-02
    provides: LogCollectorManager, DockerLogCollector

provides:
  - FileLogCollector 파일 로그 수집기
  - WebSocket subscribe-logs 메시지 핸들러
  - 실시간 로그 스트리밍 (100ms 배치)
  - 소스/레벨/컨테이너 필터링

affects: [log-viewer-ui, admin-dashboard, monitoring]

tech-stack:
  added: [tail]
  patterns: [event-emitter, log-buffering, ws-channel]

key-files:
  created:
    - src/lib/log-collector/file-collector.ts
  modified:
    - src/lib/log-collector/index.ts
    - src/types/websocket.ts
    - src/lib/websocket-server.ts

key-decisions:
  - "node-tail 패키지 선택: log rotation 지원, NFS 호환(useWatchFile)"
  - "로그 버퍼링 100ms: 성능 최적화와 실시간성 균형"
  - "클라이언트별 필터링: WebSocket 레벨에서 처리 (LogCollectorManager는 전체 로그 전달)"

patterns-established:
  - "WebSocket 채널 확장 패턴: enum/schema/handler 3단계"
  - "로그 수집기 인터페이스: on('log')/on('error')/start()/stop()"

duration: 12min
completed: 2026-01-16
---

# Phase 36 Plan 03: File Log Collector + WebSocket Log Channel Summary

**FileLogCollector로 Pino JSON 로그 실시간 수집, WebSocket subscribe-logs 채널로 클라이언트 스트리밍**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-16T12:45:00Z
- **Completed:** 2026-01-16T12:57:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- FileLogCollector 클래스로 Pino JSON 로그 파일 실시간 모니터링
- node-tail 패키지 적용 (log rotation, NFS 호환)
- WebSocket subscribe-logs/unsubscribe-logs 메시지 타입 추가
- 100ms 버퍼링으로 로그 배치 전송 (성능 최적화)
- 소스/레벨/컨테이너 필터링 지원

## Task Commits

1. **Task 1: FileLogCollector 클래스 구현** - `91bea67` (feat)
2. **Task 2: WebSocket 로그 채널 확장** - `99a8d31` (feat)

**Plan metadata:** 이 커밋에 포함

## Files Created/Modified

- `src/lib/log-collector/file-collector.ts` - FileLogCollector 클래스, Pino JSON 파싱
- `src/lib/log-collector/index.ts` - LogCollectorManager startFileCollector 메서드
- `src/types/websocket.ts` - WSLogSubscribeMessage, WSLogMessage 등 스키마
- `src/lib/websocket-server.ts` - handleLogSubscribe, flushLogBuffer 등 핸들러

## Decisions Made

1. **node-tail 패키지 선택**
   - log rotation 시 자동 재연결 (follow: true)
   - NFS 호환성 (useWatchFile: true)
   - 기존 로그 건너뜀 (fromBeginning: false)

2. **로그 버퍼 플러시 간격 100ms**
   - 너무 짧으면 WebSocket 메시지 과다
   - 너무 길면 실시간성 저하
   - 100ms가 적절한 균형점

3. **클라이언트별 필터링**
   - LogCollectorManager는 전체 로그 전달 (필터 없음)
   - WebSocket 레벨에서 클라이언트별 필터 적용
   - 구독 옵션으로 sources, minLevel, containers 지정

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Issues Encountered

None

## User Setup Required

None - 외부 서비스 설정 불필요.

## Next Phase Readiness

- 로그 수집 인프라 완성 (File + Docker)
- WebSocket 로그 스트리밍 준비 완료
- 다음 단계: 로그 뷰어 UI 구현 또는 Phase 37 진행

---
*Phase: 36-log-aggregation*
*Completed: 2026-01-16*
