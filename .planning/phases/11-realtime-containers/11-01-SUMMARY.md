---
phase: 11-realtime-containers
plan: 01
subsystem: websocket
tags: [websocket, containers, real-time, react-hooks]

# Dependency graph
requires:
  - phase: 09-websocket-infrastructure
    provides: WebSocket 서버/클라이언트 인프라, broadcastToChannel, useWebSocket 훅
  - phase: 10-realtime-metrics
    provides: 메트릭 브로드캐스트 패턴, useRealtimeMetrics 훅 패턴
provides:
  - WSContainersDataSchema (확장된 컨테이너 타입)
  - startContainersBroadcast(), stopContainersBroadcast() (브로드캐스트 제어)
  - sendCurrentContainers() (즉시 전송)
  - useRealtimeContainers 훅 (실시간 컨테이너 구독)
  - handleContainerAction 실제 Docker 액션 처리
affects: [UI 컴포넌트 실시간 업데이트, 컨테이너 관리 페이지]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 컨테이너 브로드캐스트 패턴 (메트릭 패턴과 동일)
    - WebSocket 통한 컨테이너 액션 처리 패턴
    - 액션 후 즉시 브로드캐스트로 전체 클라이언트 동기화

key-files:
  created:
    - src/hooks/useRealtimeContainers.ts
  modified:
    - src/types/websocket.ts
    - src/lib/websocket-server.ts
    - src/config/constants.ts
    - src/app/api/ws/route.ts

key-decisions:
  - "WSContainersData에 image, ports, created 포함 (ContainerData와 동일한 정보)"
  - "handleContainerAction에서 실제 Docker 함수 호출 (stub 제거)"
  - "액션 성공 후 500ms 지연 뒤 전체 컨테이너 목록 브로드캐스트"
  - "useRealtimeContainers에 폴링 fallback 기본 활성화"
  - "getLogs는 HTTP API 유지 (로그 대용량이라 WebSocket 비적합)"

patterns-established:
  - "WebSocket 채널별 전용 훅 패턴 (useRealtimeContainers)"
  - "액션 응답 대기를 위한 Promise + timeout 패턴"
  - "WebSocket 액션 → container-ack 응답 → 브로드캐스트 플로우"

issues-created: []

# Metrics
duration: 8min
completed: 2026-01-15
---

# Phase 11 Plan 01: Real-time Containers Summary

**WebSocket 기반 컨테이너 상태 실시간 스트리밍 - 서버 브로드캐스트 + useRealtimeContainers 훅 + 컨테이너 액션 처리**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-15T15:52:05Z
- **Completed:** 2026-01-15T16:00:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- WSContainersDataSchema를 ContainerData와 일치시킨 확장 타입 정의 (image, ports, created 포함)
- 서버 시작 시 자동으로 10초마다 컨테이너 목록 브로드캐스트
- containers 채널 구독 시 즉시 현재 컨테이너 목록 전송
- useRealtimeContainers 훅으로 기존 useContainers와 동일한 인터페이스 제공
- WebSocket 실패 시 폴링으로 자동 fallback
- handleContainerAction에서 실제 Docker 액션 (start/stop/restart) 실행
- 액션 성공 후 전체 구독자에게 컨테이너 목록 브로드캐스트

## Task Commits

Each task was committed atomically:

1. **Task 1: WebSocket 컨테이너 타입 확장 및 브로드캐스트 로직** - `6c4b659` (feat)
2. **Task 2: useRealtimeContainers 훅 구현** - `fd8b3b2` (feat)
3. **Task 3: 컨테이너 브로드캐스트 ws route 통합** - `219b30e` (feat)

**Plan metadata:** `b122c51` (docs: complete plan)

## Files Created/Modified

- `src/types/websocket.ts` - WSContainersDataSchema 확장 (image, ports, created 포함)
- `src/lib/websocket-server.ts` - startContainersBroadcast(), sendCurrentContainers(), handleContainerAction 실제 구현
- `src/config/constants.ts` - WEBSOCKET_CONFIG.CONTAINERS_BROADCAST_INTERVAL 추가 (10000ms)
- `src/app/api/ws/route.ts` - 모듈 로드 시 컨테이너 브로드캐스트 자동 시작
- `src/hooks/useRealtimeContainers.ts` - 실시간 컨테이너 전용 React 훅

## Decisions Made

- **완전한 컨테이너 정보**: WSContainersData에 image, ports, created 포함하여 기존 ContainerData와 동일한 정보 제공
- **실제 Docker 액션**: handleContainerAction에서 stub 제거하고 실제 startContainer, stopContainer, restartContainer 함수 호출
- **액션 후 브로드캐스트**: 컨테이너 상태 변경 후 500ms 지연을 두고 전체 구독자에게 최신 목록 브로드캐스트
- **로그는 HTTP 유지**: getLogs는 WebSocket 대신 HTTP API 사용 (로그 데이터가 대용량이라 WebSocket 비적합)
- **Fallback 기본 활성화**: useRealtimeContainers의 enableFallback 기본값 true로 안정성 확보

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Step

Phase 11 complete (plan 1/1). Ready for Phase 12 (Email Notification)

---
*Phase: 11-realtime-containers*
*Completed: 2026-01-15*
