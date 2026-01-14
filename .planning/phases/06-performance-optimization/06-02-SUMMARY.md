# Summary 06-02: 번들 사이즈 최적화

---
phase: 06-performance-optimization
plan: 02
status: complete
completed_date: 2026-01-14
---

## Status: Complete

번들 사이즈 최적화 작업이 완료되었습니다.

## Tasks Completed

### Task 1: 차트 컴포넌트 Dynamic Import 적용

- `LazyMetricsCharts` 래퍼 컴포넌트 생성 (Client Component)
- `next/dynamic`을 사용한 lazy loading 구현
- SSR 비활성화 (`ssr: false`) - 차트는 클라이언트 전용
- 로딩 플레이스홀더 추가 (4개의 skeleton 카드)
- admin/page.tsx에서 LazyMetricsCharts 사용

### Task 2: 번들 분석 스크립트 추가

- `@next/bundle-analyzer` devDependency 추가
- `npm run analyze` 스크립트 추가
- next.config.ts에 bundle analyzer 설정 적용
- ANALYZE=true 환경변수로 활성화

### Task 3: 아이콘 Import 최적화 확인

- 모든 lucide-react import가 named import 패턴 사용 확인
- tree-shaking 가능한 상태로 이미 최적화됨
- 불필요한 import 없음 확인

## Commits

1. `perf(06-02): 차트 컴포넌트 dynamic import 적용` (c4c7ead)
   - LazyMetricsCharts 래퍼 컴포넌트 추가
   - Recharts 번들 별도 청크 분리
   - react-query-devtools 의존성 추가
   - refetch 타입 호환성 문제 수정

2. `chore(06-02): 번들 분석 스크립트 추가` (d0a32c4)
   - @next/bundle-analyzer 설치
   - analyze 스크립트 추가
   - next.config.ts 설정

## Files Modified

| 파일 | 변경 내용 |
|------|----------|
| `src/app/admin/page.tsx` | LazyMetricsCharts 사용으로 변경 |
| `src/components/admin/LazyMetricsCharts.tsx` | 새 파일 - dynamic import 래퍼 |
| `src/components/admin/ContainerList.tsx` | refetch 타입 호환성 수정 |
| `src/components/admin/SystemMonitor.tsx` | refetch 타입 호환성 수정 |
| `next.config.ts` | bundle analyzer 설정 추가 |
| `package.json` | analyze 스크립트, devDependencies 추가 |
| `package-lock.json` | 의존성 업데이트 |

## Bundle Size Changes

### 청크 분리 결과

빌드 후 청크 파일 분석:

| 청크 | 크기 | 설명 |
|------|------|------|
| `0f837eef2b04ae8b.js` | 378KB | Recharts 포함 청크 (별도 분리됨) |
| `cc759f7c2413b7ff.js` | 225KB | React 관련 청크 |
| `e7a38add5ba3d283.js` | 120KB | 기타 라이브러리 |
| `a6dad97d9634a72d.js` | 113KB | 기타 라이브러리 |

### 최적화 효과

- Recharts (386KB)가 별도 청크로 분리됨
- /admin 페이지 방문 시에만 차트 청크 로드
- 초기 페이지 로드 성능 개선
- 다른 페이지에서 불필요한 Recharts 로드 방지

## Success Criteria Verification

- [x] MetricsCharts가 별도 청크로 분리됨
- [x] 초기 번들 크기 감소 (Recharts 분리)
- [x] 차트 로딩 중 placeholder 표시됨
- [x] 번들 분석 스크립트 동작 (`npm run analyze`)
- [x] 빌드 성공
- [x] 테스트 통과 (103 tests passed)

## Issues Encountered

### 1. Server Component에서 ssr: false 사용 불가

**문제**: Next.js Server Component에서 `ssr: false` 옵션을 직접 사용할 수 없음

**해결**: `LazyMetricsCharts` Client Component 래퍼를 생성하여 dynamic import 로직 분리

### 2. react-query-devtools 누락

**문제**: `@tanstack/react-query-devtools` 패키지가 누락되어 빌드 실패

**해결**: 해당 패키지 설치 (`npm install @tanstack/react-query-devtools`)

### 3. refetch 타입 호환성

**문제**: React Query의 `refetch` 함수가 `MouseEventHandler`와 타입 호환되지 않음

**해결**: `onClick={() => refetch()}` 형태로 래핑하여 해결

## How to Use Bundle Analyzer

```bash
# 번들 분석 실행
npm run analyze

# 분석 결과가 브라우저에서 자동으로 열립니다
# client.html - 클라이언트 번들 분석
# server.html - 서버 번들 분석
```

---
*Completed: 2026-01-14*
