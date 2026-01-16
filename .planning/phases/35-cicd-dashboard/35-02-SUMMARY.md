---
phase: 35-cicd-dashboard
plan: 02
subsystem: frontend
tags: [github, react-hooks, tanstack-query, workflow, ci-cd, dynamic-import]

dependency_graph:
  requires:
    - phase: 35-01
      provides: useGitHub hooks, GitHubSetup, RepoList 컴포넌트
    - phase: 34-02
      provides: GitHub Workflows/Runs API 라우트
  provides:
    - useWorkflows 훅 - 워크플로우 목록 조회
    - useWorkflowRuns 훅 - 실행 기록 조회 (refreshInterval)
    - WorkflowStatusBadge 컴포넌트 - 상태별 색상 배지
    - WorkflowList 컴포넌트 - 워크플로우 목록 UI
    - WorkflowRunList 컴포넌트 - 실행 기록 테이블
    - /admin/github 워크플로우 대시보드 통합
  affects: [36-log-management, 37-log-visualization]

tech_stack:
  added: []
  patterns: [workflow-status-visualization, auto-refresh-polling, responsive-grid-layout]

key_files:
  created:
    - src/components/github/WorkflowStatusBadge.tsx
    - src/components/github/WorkflowList.tsx
    - src/components/github/WorkflowRunList.tsx
  modified:
    - src/hooks/useGitHub.ts
    - src/app/admin/github/page.tsx

key_decisions:
  - "상태 시각화: status + conclusion 조합으로 6가지 상태 (success, failure, in_progress, queued, cancelled, skipped)"
  - "자동 새로고침: React Query refetchInterval 활용 (30초)"
  - "반응형 레이아웃: lg 이상 2컬럼 그리드, 모바일에서 세로 배치 (실행 기록 우선)"
  - "워크플로우 필터링: 클라이언트 사이드 workflowId 필터 (API 단순화)"

patterns_established:
  - "Workflow 훅 패턴: useWorkflows(owner, repo), useWorkflowRuns(owner, repo, options)"
  - "Status Badge 패턴: getStatusConfig(status, conclusion) -> bgClass, textClass, Icon, label"
  - "Dynamic Import 일관성: WorkflowList, WorkflowRunList 도 SSR 비활성화 + Loader2 스피너"

metrics:
  duration: 4min
  completed: 2026-01-16
---

# Phase 35 Plan 02: Workflow Dashboard Summary

**GitHub Actions 워크플로우 목록, 실행 기록 테이블, 상태별 색상 배지가 포함된 CI/CD 대시보드**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-16T01:05:51Z
- **Completed:** 2026-01-16T01:09:50Z
- **Tasks:** 5
- **Files created:** 3
- **Files modified:** 2

## Accomplishments

- useWorkflows, useWorkflowRuns 훅 추가 (자동 새로고침 지원)
- WorkflowStatusBadge 상태별 시각화 (6가지 상태 + 3사이즈)
- WorkflowList 워크플로우 목록 컴포넌트 (선택 기능)
- WorkflowRunList 실행 기록 테이블 (필터, 상대시간, 소요시간)
- /admin/github 페이지 워크플로우 대시보드 통합

## Task Commits

Each task was committed atomically:

1. **Task 1: useWorkflows 훅 추가** - `7707c67` (feat)
2. **Task 2: WorkflowStatusBadge 컴포넌트** - `f9849d7` (feat)
3. **Task 3: WorkflowList 컴포넌트** - `5dbe12a` (feat)
4. **Task 4: WorkflowRunList 컴포넌트** - `24384d0` (feat)
5. **Task 5: GitHub Admin 페이지 통합** - `d716977` (feat)

## Files Created/Modified

| File | Description | Lines |
|------|-------------|-------|
| `src/hooks/useGitHub.ts` | useWorkflows, useWorkflowRuns 훅 추가 | +164 |
| `src/components/github/WorkflowStatusBadge.tsx` | 상태별 색상 배지 + 아이콘 | 222 |
| `src/components/github/WorkflowList.tsx` | 워크플로우 목록 카드 | 242 |
| `src/components/github/WorkflowRunList.tsx` | 실행 기록 테이블 | 387 |
| `src/app/admin/github/page.tsx` | 워크플로우 대시보드 통합 | 232 |

## Hooks Exported

| Hook | Purpose |
|------|---------|
| `useWorkflows(owner, repo)` | 워크플로우 목록 조회 |
| `useWorkflowRuns(owner, repo, options)` | 실행 기록 조회 (filter, refreshInterval) |

## Components Exported

| Component | Purpose |
|-----------|---------|
| `WorkflowStatusBadge` | 상태별 색상 배지 (success/failure/in_progress 등) |
| `WorkflowStatusIcon` | 상태 아이콘만 표시 |
| `WorkflowList` | 워크플로우 목록, 선택 기능 |
| `WorkflowRunList` | 실행 기록 테이블, 필터, 자동 새로고침 |

## UI Features

- **WorkflowStatusBadge:**
  - 6가지 상태: success(녹색), failure(빨간색), in_progress(파란색 + 애니메이션)
  - queued/waiting(노란색), cancelled/skipped(회색)
  - 3가지 사이즈: sm, md, lg
  - 접근성: role="status", aria-label

- **WorkflowList:**
  - 워크플로우 목록 카드 (이름, 파일경로, 상태)
  - 상태별 아이콘 (active/disabled)
  - 선택 기능 (토글)
  - GitHub Actions 외부 링크

- **WorkflowRunList:**
  - 실행 기록 테이블 (상태, 워크플로우명, 브랜치, 커밋 SHA, 시간)
  - 상태 필터 (드롭다운)
  - 브랜치 필터 (입력)
  - 상대 시간 포맷: 방금 전, N분 전, N시간 전 등
  - 소요 시간 계산: N분 N초 포맷
  - 자동 새로고침 (30초)

- **GitHub Admin 페이지:**
  - 레포 선택 시 워크플로우 대시보드 표시
  - 2컬럼 레이아웃 (lg 이상): 왼쪽(워크플로우 목록), 오른쪽(실행 기록)
  - 워크플로우 선택 시 해당 실행 기록만 필터링
  - 반응형: 모바일에서 세로 배치 (실행 기록 우선)

## Decisions Made

1. **상태 시각화 조합**
   - status (queued, in_progress, completed, waiting) + conclusion (success, failure, cancelled, skipped, null)
   - 6가지 주요 상태로 정리

2. **자동 새로고침**
   - React Query refetchInterval 활용
   - 실행 중인 워크플로우 감지를 위해 30초 간격

3. **반응형 레이아웃**
   - lg 이상: 2컬럼 그리드 (320px 고정폭 + 1fr)
   - 모바일: 세로 배치, 실행 기록 먼저 표시 (중요도 높음)

4. **워크플로우 필터링**
   - API는 전체 실행 기록 반환
   - workflowId 필터는 클라이언트에서 처리 (API 단순화)

## Deviations from Plan

None - 계획대로 정확히 실행됨.

## Issues Encountered

None - 모든 태스크 정상 완료.

## Known Issues (Carried Forward)

1. **/login 페이지 빌드 에러**: untracked 파일, 별도 수정 필요
2. **토큰 암호화 미구현**: 현재 평문 저장, 향후 암호화 필요

## Next Phase Readiness

**Phase 35 완료.** CI/CD Dashboard 기본 기능 구현 완료.

**다음 Phase 36 (Log Management) 준비:**
- [x] GitHub 워크플로우/실행 기록 조회 기능 완성
- [x] 상태 시각화 패턴 확립
- [ ] 로그 데이터 모델 설계 필요 (Research Phase)

**Blockers:** 없음

---
*Phase: 35-cicd-dashboard*
*Plan: 02*
*Completed: 2026-01-16*
