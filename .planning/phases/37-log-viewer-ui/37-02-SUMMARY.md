---
phase: 37
plan: 02
title: "실시간 로그 스트림 훅 및 UI 컴포넌트"
subsystem: "log-viewer"
tags: [websocket, react-virtual, hooks, components]

depends_on:
  requires: [36-01, 36-02, 36-03]
  provides: [useLogStream, LogFilter, LogEntry, LogList]
  affects: [37-03]

tech_stack:
  added: []
  patterns: [websocket-subscription, virtualized-list, debounced-input]

key_files:
  created:
    - src/hooks/useLogStream.ts
    - src/components/logs/LogFilter.tsx
    - src/components/logs/LogEntry.tsx
    - src/components/logs/LogList.tsx
    - src/components/logs/index.ts
  modified: []

decisions:
  - id: log-virtualization-threshold
    choice: "50개 이상 로그 시 가상화 활성화"
    reason: "작은 목록에서 가상화 오버헤드 방지"
  - id: log-max-retention
    choice: "기본 1000개 로그 보관"
    reason: "메모리 관리와 사용성 균형"

metrics:
  duration: "~8min"
  completed: "2026-01-16"
---

# Phase 37 Plan 02: 실시간 로그 스트림 훅 및 UI 컴포넌트 Summary

**One-liner:** WebSocket 기반 useLogStream 훅과 가상화된 LogFilter/LogEntry/LogList UI 컴포넌트

## What Was Done

### Task 1: useLogStream 훅 구현

**src/hooks/useLogStream.ts**

WebSocket 기반 실시간 로그 구독 훅:

- `LogStreamOptions`: sources, minLevel, containers, enabled, maxLogs 옵션
- `subscribe-logs` / `unsubscribe-logs` 메시지 전송
- 최대 로그 개수 제한 (기본 1000개) 메모리 관리
- 필터 옵션 변경 시 자동 재구독
- 반환값: `{ logs, isStreaming, connectionStatus, startStream, stopStream, clearLogs, error }`

**사용 예시:**
```tsx
const { logs, isStreaming, startStream, stopStream } = useLogStream({
  sources: ['docker'],
  minLevel: 'warn',
  containers: ['nginx'],
});
```

### Task 2: LogFilter 컴포넌트 구현

**src/components/logs/LogFilter.tsx**

로그 필터 UI:

- 소스 필터: Docker, Journal, App 버튼 토글
- 레벨 필터: trace ~ fatal Badge 토글 (LOG_LEVEL_COLORS 적용)
- 검색어 입력: 300ms 디바운스
- 모바일 반응형: 접기/펼치기 지원
- 초기화 버튼: 모든 필터 리셋

### Task 3: LogEntry, LogList 컴포넌트 구현

**src/components/logs/LogEntry.tsx**

개별 로그 항목 표시:

- 포맷: `[HH:mm:ss.SSS] [LEVEL] [source:id] message`
- LOG_LEVEL_COLORS로 레벨 색상 적용
- 메타데이터 펼치기/접기 (expandable)
- React.memo로 성능 최적화

**src/components/logs/LogList.tsx**

가상화된 로그 목록:

- @tanstack/react-virtual `useVirtualizer` 사용
- 50개 이상 로그 시 가상화 활성화
- 자동 스크롤 (새 로그 추가 시 하단으로)
- 사용자 스크롤 감지 → 자동 스크롤 비활성화
- 빈 상태/로딩 UI

## Technical Highlights

### WebSocket 구독 패턴

```typescript
// useLogStream.ts
const subscribeMessage = {
  type: 'subscribe-logs',
  sources: sources as WSLogSource[],
  containers,
  minLevel: minLevel as WSLogLevel,
  timestamp: Date.now(),
};

sendMessage(subscribeMessage);
```

### 가상화 패턴

```tsx
// LogList.tsx
const virtualizer = useVirtualizer({
  count: logs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => LOG_ITEM_HEIGHT, // 28px
  overscan: 5,
  enabled: logs.length >= 50,
});
```

### 디바운스 검색

```tsx
// LogFilter.tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (localSearch !== search) {
      onSearchChange(localSearch);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [localSearch]);
```

## Commits

| Hash | Message |
|------|---------|
| 5eab78f | feat(37-02): useLogStream 훅 구현 |
| c88e031 | feat(37-02): LogFilter 컴포넌트 구현 |
| 6c2ba84 | feat(37-02): LogEntry, LogList 컴포넌트 구현 |

## Deviations from Plan

None - 플랜대로 정확히 실행됨.

## Next Phase Readiness

**Ready for 37-03:**
- useLogStream 훅으로 실시간 로그 구독 가능
- LogFilter로 소스/레벨/검색 필터링 가능
- LogList로 대용량 로그 가상화 렌더링 가능
- 37-03에서 이 컴포넌트들을 조합하여 로그 대시보드 페이지 구현 예정

## Files Created

```
src/
├── hooks/
│   └── useLogStream.ts          # 실시간 로그 구독 훅
└── components/
    └── logs/
        ├── index.ts             # 모듈 export
        ├── LogFilter.tsx        # 필터 UI
        ├── LogEntry.tsx         # 개별 로그 항목
        └── LogList.tsx          # 가상화 목록
```
