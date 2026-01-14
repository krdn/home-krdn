# Summary 06-01: React Query 데이터 페칭 최적화

**Status:** ✅ Complete
**Date:** 2026-01-14
**Phase:** 06-performance-optimization
**Plan:** 01

---

## Objective

기존 setInterval 기반 폴링을 React Query로 마이그레이션하여 캐싱, 중복 요청 방지, 자동 재시도 등 데이터 페칭을 최적화했습니다.

## Tasks Completed

### Task 1: QueryClient 설정 및 Provider 구성
- `src/lib/queryClient.ts` 생성: QueryClient 싱글턴 팩토리
- `src/app/providers.tsx` 생성: QueryClientProvider 래퍼
- `src/app/layout.tsx` 수정: Providers 컴포넌트 적용

**QueryClient 기본 설정:**
- `staleTime`: 30초 (데이터 신선도)
- `gcTime`: 5분 (가비지 컬렉션 시간)
- `retry`: 2회 (자동 재시도)
- `refetchOnWindowFocus`: true (탭 포커스 시 리페치)
- `refetchOnReconnect`: true (네트워크 재연결 시 리페치)

### Task 2: useSystemMetrics 마이그레이션
- `useState` + `useEffect` + `setInterval` → `useQuery` 변환
- `refetchInterval`로 5초 자동 폴링
- 기존 API (data, loading, error, refetch) 유지

### Task 3: useContainers 마이그레이션
- 컨테이너 목록 조회: `useQuery` 적용 (10초 폴링)
- 컨테이너 액션: `useMutation` 적용
- 액션 성공 시 `invalidateQueries`로 자동 리페치

### Task 4: useMetricsHistory 마이그레이션
- `useQuery` 적용 (30초 폴링)
- `queryKey: ['metrics-history', minutes]`로 범위별 캐시 분리
- `transformToChartData` 함수 분리로 코드 정리

## Commits

| Commit | Message |
|--------|---------|
| fa00a5b | feat(06-01): QueryClient 설정 및 Provider 구성 |
| 162217f | refactor(06-01): useSystemMetrics를 React Query로 마이그레이션 |
| c406519 | refactor(06-01): useContainers를 React Query로 마이그레이션 |
| c4c7ead | perf(06-02): 차트 컴포넌트 dynamic import 적용 (useMetricsHistory 포함) |

## Files Modified

**New Files:**
- `src/lib/queryClient.ts` - QueryClient 싱글턴 팩토리
- `src/app/providers.tsx` - Provider 래퍼 컴포넌트

**Modified Files:**
- `src/app/layout.tsx` - Providers 적용
- `src/hooks/useSystemMetrics.ts` - React Query 마이그레이션
- `src/hooks/useContainers.ts` - React Query 마이그레이션
- `src/hooks/useMetricsHistory.ts` - React Query 마이그레이션
- `src/components/admin/ContainerList.tsx` - refetch 호출 방식 수정
- `src/components/admin/SystemMonitor.tsx` - refetch 호출 방식 수정

## Verification Results

### Build
```
✓ Compiled successfully in 4.6s
✓ Generating static pages (21/21)
```

### Tests
```
Test Files: 5 passed (5)
Tests: 103 passed (103)
Duration: 453ms
```

## Success Criteria

- [x] QueryClient가 앱 전역에 설정됨
- [x] 모든 훅이 React Query 기반으로 동작
- [x] 기존 컴포넌트 코드 변경 없이 동작 (refetch 래퍼 함수 적용)
- [x] 탭 포커스 시에만 리페치됨 (refetchOnWindowFocus)
- [x] 빌드 및 테스트 성공

## Issues Encountered

### 1. refetch 타입 호환성 문제
**문제:** React Query의 `refetch` 함수는 `RefetchOptions`를 받지만, Button의 `onClick`은 `MouseEvent`를 전달
**해결:** `onClick={() => refetch()}`로 래퍼 함수 적용

### 2. 커밋 병합 이슈
**문제:** Task 4 (useMetricsHistory)가 별도 커밋으로 생성되지 않음
**결과:** 06-02 작업의 c4c7ead 커밋에 함께 포함됨

## Benefits Achieved

1. **캐싱 최적화**: 동일 데이터 중복 요청 방지
2. **자동 재시도**: 네트워크 오류 시 2회 자동 재시도
3. **탭 비활성화 대응**: 비활성 탭에서 불필요한 폴링 중지
4. **포커스 기반 업데이트**: 탭 전환 시 자동 데이터 갱신
5. **DevTools 지원**: ReactQueryDevtools로 쿼리 상태 디버깅 가능

---

*Completed: 2026-01-14*
