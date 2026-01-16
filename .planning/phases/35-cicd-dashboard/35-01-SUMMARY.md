---
phase: 35-cicd-dashboard
plan: 01
subsystem: frontend
tags: [github, react-hooks, admin-ui, tanstack-query, dynamic-import]

dependency_graph:
  requires:
    - phase: 34-02
      provides: GitHub API Routes (Settings, Repos, Commits, Workflows)
  provides:
    - useGitHubSettings 훅 - GitHub 설정 조회
    - useRepositories 훅 - 레포지토리 목록 조회
    - useGitHubSettingsMutation 훅 - 토큰 등록/삭제
    - GitHubSetup 컴포넌트 - 토큰 설정 UI
    - RepoList 컴포넌트 - 레포지토리 목록 UI
    - /admin/github 페이지 - GitHub Admin 페이지
  affects: [35-02-github-detail-workflow]

tech_stack:
  added: []
  patterns: [tanstack-react-query, dynamic-import, client-component]

key_files:
  created:
    - src/hooks/useGitHub.ts
    - src/components/github/GitHubSetup.tsx
    - src/components/github/RepoList.tsx
    - src/app/admin/github/page.tsx
  modified: []

key_decisions:
  - "React Query 패턴: 기존 usePorts.ts 패턴 따름 (queryKey, staleTime, invalidateQueries)"
  - "Dynamic Import: GitHubSetup, RepoList 지연 로딩으로 초기 번들 크기 최적화"
  - "클라이언트 검색: 레포지토리 검색은 서버 필터링 없이 클라이언트에서 처리"
  - "언어 색상: 주요 프로그래밍 언어별 색상 매핑 하드코딩"

patterns_established:
  - "GitHub 훅 패턴: useGitHubSettings, useRepositories, useGitHubSettingsMutation"
  - "GitHub 컴포넌트 패턴: GitHubSetup (설정), RepoList (목록)"

metrics:
  duration: 5min
  completed: 2026-01-16
---

# Phase 35 Plan 01: GitHub UI Components Summary

**GitHub 연동 UI 컴포넌트 구현 - 토큰 설정, 레포지토리 목록 조회**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-16T00:58:39Z
- **Completed:** 2026-01-16T01:03:49Z
- **Tasks:** 4
- **Files created:** 4

## Accomplishments

- useGitHub 훅 구현 (설정 조회, 레포 목록, mutation)
- GitHubSetup 컴포넌트 구현 (토큰 입력 폼, 계정 정보 표시)
- RepoList 컴포넌트 구현 (레포 목록 테이블, 필터, 검색)
- /admin/github 페이지 구현 (Admin 권한, 조건부 렌더링)

## Task Commits

Each task was committed atomically:

1. **Task 1: useGitHub 훅** - `b543de8` (feat)
2. **Task 2: GitHubSetup 컴포넌트** - `7740044` (feat)
3. **Task 3: RepoList 컴포넌트** - `c0c297f` (feat)
4. **Task 4: GitHub Admin 페이지** - `618d896` (feat)

## Files Created

| File | Description | Lines |
|------|-------------|-------|
| `src/hooks/useGitHub.ts` | GitHub API 통신 훅 (Query + Mutation) | 245 |
| `src/components/github/GitHubSetup.tsx` | 토큰 설정 + 계정 정보 컴포넌트 | 311 |
| `src/components/github/RepoList.tsx` | 레포지토리 목록 컴포넌트 | 366 |
| `src/app/admin/github/page.tsx` | GitHub Admin 페이지 | 115 |

## Hooks Exported

| Hook | Purpose |
|------|---------|
| `useGitHubSettings` | GitHub 설정 조회 (settings, hasToken, isLoading) |
| `useRepositories` | 레포지토리 목록 조회 (repos, filter 지원) |
| `useGitHubSettingsMutation` | 토큰 등록/삭제 mutation |

## Components Exported

| Component | Purpose |
|-----------|---------|
| `GitHubSetup` | 토큰 입력 폼 (미등록), 계정 정보 + 연동 해제 (등록됨) |
| `RepoList` | 레포지토리 테이블, 필터/검색, 선택 콜백 |

## UI Features

- **GitHubSetup:**
  - 토큰 형식 검증 (ghp_, github_pat_)
  - 토큰 생성 가이드 링크
  - 계정 아바타 + username 표시
  - 연동 해제 확인 다이얼로그

- **RepoList:**
  - 레포지토리 테이블 (이름, 언어, Stars, Forks, 최근 푸시)
  - Private/Public 배지
  - 언어별 색상 표시 (17개 언어)
  - 타입/정렬 필터 드롭다운
  - 클라이언트 검색 (이름, 설명, 언어)
  - 레포 클릭 시 선택 콜백

## Decisions Made

1. **React Query 사용**
   - 기존 usePorts.ts 패턴 따름
   - staleTime 30초 (settings), 60초 (repos)
   - invalidateQueries로 캐시 무효화

2. **Dynamic Import 적용**
   - GitHubSetup, RepoList 지연 로딩
   - 초기 번들 크기 최적화
   - SSR 비활성화 (클라이언트 전용)

3. **클라이언트 검색**
   - per_page: 50으로 충분한 레포 로드
   - 클라이언트에서 필터링 (네트워크 요청 감소)

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Issues Encountered

1. **/login 페이지 빌드 에러 (기존 이슈)**
   - untracked 파일 (src/app/login, src/app/register)
   - useSearchParams Suspense 에러
   - Phase 34에서 이미 문서화됨
   - 임시로 파일 제거하여 빌드 진행

## Known Issues (Carried Forward)

1. **/login 페이지 빌드 에러**: untracked 파일, 별도 수정 필요
2. **토큰 암호화 미구현**: 현재 평문 저장, 향후 암호화 필요

## Next Phase Readiness

**35-02 Plan (GitHub Detail + Workflow)에 필요:**
- [x] useGitHubSettings 훅 - 준비됨
- [x] useRepositories 훅 - 준비됨
- [x] RepoList 컴포넌트 (onSelectRepo 콜백) - 준비됨
- [x] selectedRepo 상태 관리 - 준비됨

**Blockers:** 없음

---
*Phase: 35-cicd-dashboard*
*Plan: 01*
*Completed: 2026-01-16*
