---
phase: 37-log-viewer-ui
plan: 01
subsystem: logs
tags: [api, react-query, hooks, logs]

dependency-graph:
  requires:
    - 36-log-aggregation (LogStorage 서비스)
  provides:
    - GET /api/logs (로그 목록 조회 API)
    - GET /api/logs/stats (로그 통계 API)
    - useLogs hook (로그 조회 React Query 훅)
    - useLogStats hook (통계 조회 React Query 훅)
  affects:
    - 37-02 (LogViewer 컴포넌트)
    - 37-03 (Admin 로그 대시보드)

tech-stack:
  added: []
  patterns:
    - TanStack Query 기반 데이터 페칭
    - 쿼리 파라미터 → Zod 스키마 검증
    - staleTime 기반 캐싱 전략

key-files:
  created:
    - src/app/api/logs/route.ts
    - src/app/api/logs/stats/route.ts
    - src/hooks/useLogs.ts

decisions:
  - id: logs-api-response-format
    choice: "success + data 래퍼 구조"
    rationale: "기존 API 패턴과 일관성 유지"
  - id: logs-query-params
    choice: "콤마 구분 배열 파라미터"
    rationale: "sources=docker,app 형태로 URL 가독성 향상"
  - id: hooks-stale-time
    choice: "logs 10초, stats 30초"
    rationale: "로그는 실시간성 중요, 통계는 자주 갱신 불필요"

metrics:
  duration: ~4min
  completed: 2026-01-16
---

# Phase 37 Plan 01: Log REST API + Hooks Summary

로그 조회 REST API 2개와 TanStack Query 기반 React 훅 2개를 구현하여 로그 뷰어 UI의 데이터 레이어를 완성했습니다.

## One-liner

Phase 36 LogStorage 기반 로그 조회 API와 useLogs/useLogStats React Query 훅 구현

## What Was Done

### Task 1: Log REST API 구현

**GET /api/logs**
- 쿼리 파라미터: sources, levels, sourceId, search, startTime, endTime, limit, offset
- 콤마 구분 배열 파싱 (sources=docker,app)
- LogQuerySchema Zod 검증
- logStorage.query() 호출
- VIEWER 이상 권한 필요

**GET /api/logs/stats**
- logStorage.getStats() 호출
- 소스별/레벨별 통계 + 전체 개수 반환
- VIEWER 이상 권한 필요

### Task 2: useLogs, useLogStats 훅 구현

**useLogs 훅**
- LogQuery 필터 옵션 지원
- enabled 조건부 활성화
- refetchInterval 자동 갱신
- staleTime 10초 (실시간성 유지)

**useLogStats 훅**
- 통계 조회 전용
- staleTime 30초 (자주 갱신 불필요)
- bySource, byLevel 분리 반환

## API Response Format

```typescript
// GET /api/logs
{
  success: true,
  data: {
    logs: LogEntry[],
    total: number,
    limit: number,
    offset: number
  }
}

// GET /api/logs/stats
{
  success: true,
  data: {
    bySource: [{ key: 'docker', count: 150 }, ...],
    byLevel: [{ key: 'info', count: 200 }, ...],
    total: 500
  }
}
```

## Hook Usage Examples

```tsx
// 기본 조회
const { logs, total, isLoading } = useLogs();

// 필터링
const { logs } = useLogs({
  sources: ['docker'],
  levels: ['error', 'warn'],
  limit: 50,
});

// 자동 갱신 (5초마다)
const { logs } = useLogs({ refetchInterval: 5000 });

// 통계 조회
const { stats, bySource, byLevel } = useLogStats();
```

## Deviations from Plan

None - 플랜대로 정확히 실행됨.

## Testing Notes

- TypeScript 타입 체크 통과 (tsc --noEmit)
- API 엔드포인트 2개 생성 완료
- React Query 훅 2개 export 확인

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| src/app/api/logs/route.ts | 201 | 로그 목록 조회 API |
| src/app/api/logs/stats/route.ts | 89 | 로그 통계 조회 API |
| src/hooks/useLogs.ts | 250 | useLogs, useLogStats 훅 |

## Dependencies

**Uses:**
- @/lib/log-storage (logStorage 싱글톤)
- @/types/log (LogQuery, LogQueryResult, LogStats)
- @tanstack/react-query (useQuery)
- @/lib/auth (verifyToken)
- @/lib/rbac (isRoleAtLeast)

## Next Phase Readiness

Phase 37-02 (LogViewer 컴포넌트) 진행 준비 완료:
- API 엔드포인트 준비됨
- useLogs 훅으로 데이터 페칭 가능
- useLogStats 훅으로 통계 표시 가능
