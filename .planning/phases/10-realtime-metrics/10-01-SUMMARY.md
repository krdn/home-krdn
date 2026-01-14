---
phase: 10-realtime-metrics
plan: 01
subsystem: websocket
tags: [websocket, metrics, real-time, react-hooks]

# Dependency graph
requires:
  - phase: 09-websocket-infrastructure
    provides: WebSocket 서버/클라이언트 인프라, broadcastToChannel, useWebSocket 훅
provides:
  - WSMetricsDataSchema (확장된 메트릭 타입)
  - startMetricsBroadcast(), stopMetricsBroadcast() (브로드캐스트 제어)
  - useRealtimeMetrics 훅 (실시간 메트릭 구독)
affects: [11-realtime-containers, UI 컴포넌트 실시간 업데이트]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 메트릭 브로드캐스트 패턴 (모듈 로드 시 자동 시작)
    - WebSocket fallback to polling 패턴

key-files:
  created:
    - src/hooks/useRealtimeMetrics.ts
  modified:
    - src/types/websocket.ts
    - src/lib/websocket-server.ts
    - src/config/constants.ts
    - src/app/api/ws/route.ts

key-decisions:
  - "WSMetricsData를 SystemMetrics와 일치시키되 network/processes 제외 (경량화)"
  - "서버 시작 시 무조건 브로드캐스트 시작 (구독자 체크 없이 단순 구현)"
  - "useRealtimeMetrics에 폴링 fallback 기본 활성화 (안정성)"

patterns-established:
  - "WebSocket 채널별 전용 훅 패턴 (useRealtimeMetrics)"
  - "WSData → ClientData 변환 레이어 패턴"

issues-created: []

# Metrics
duration: 12min
completed: 2026-01-15
---

# Phase 10 Plan 01: Real-time Metrics Summary

**WebSocket 기반 시스템 메트릭 실시간 스트리밍 - 서버 브로드캐스트 + useRealtimeMetrics 훅**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-15T14:30:00Z
- **Completed:** 2026-01-15T14:42:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- WSMetricsDataSchema를 SystemMetrics 구조와 일치시킨 확장 타입 정의
- 서버 시작 시 자동으로 5초마다 메트릭 브로드캐스트
- metrics 채널 구독 시 즉시 현재 메트릭 전송
- useRealtimeMetrics 훅으로 기존 useSystemMetrics와 동일한 인터페이스 제공
- WebSocket 실패 시 폴링으로 자동 fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: WebSocket 메트릭 타입 확장 및 브로드캐스트 로직** - `bce8243` (feat)
2. **Task 2: WebSocket 라우트에 메트릭 브로드캐스트 활성화** - `53f5e9f` (feat)
3. **Task 3: useRealtimeMetrics 훅 구현** - `89a44d6` (feat)

**Plan metadata:** `49bdd12` (docs: complete plan)

## Files Created/Modified
- `src/types/websocket.ts` - WSMetricsDataSchema 확장 (cpu, memory, disk 상세 구조)
- `src/lib/websocket-server.ts` - startMetricsBroadcast(), sendCurrentMetrics() 추가
- `src/config/constants.ts` - WEBSOCKET_CONFIG.METRICS_BROADCAST_INTERVAL 추가
- `src/app/api/ws/route.ts` - 모듈 로드 시 브로드캐스트 자동 시작
- `src/hooks/useRealtimeMetrics.ts` - 실시간 메트릭 전용 React 훅

## Decisions Made
- **경량화 전략**: WSMetricsData에서 network, processes, model, platform 필드 제외하여 WebSocket 트래픽 최소화
- **단순 브로드캐스트**: 구독자 유무 체크 없이 서버 시작 시 무조건 브로드캐스트 (경쟁 조건 방지)
- **Fallback 기본 활성화**: useRealtimeMetrics의 enableFallback 기본값 true로 안정성 확보

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## Next Step
Phase 10 complete (plan 1/1). Ready for Phase 11 (Real-time Containers)

---
*Phase: 10-realtime-metrics*
*Completed: 2026-01-15*
