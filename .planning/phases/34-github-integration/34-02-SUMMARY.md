---
phase: 34-github-integration
plan: 02
subsystem: api
tags: [github, rest-api, next-api-routes, octokit, authentication]

dependency_graph:
  requires:
    - phase: 34-01
      provides: GitHub Service Layer, GitHubSettings Prisma 모델, GitHub 타입 정의
  provides:
    - GitHub Settings CRUD API (GET/POST/DELETE /api/github)
    - 레포지토리 목록 API (GET /api/github/repos)
    - 레포지토리 상세 API (GET /api/github/repos/[owner]/[repo])
    - 커밋 히스토리 API (GET /api/github/repos/[owner]/[repo]/commits)
    - 워크플로우 목록 API (GET /api/github/repos/[owner]/[repo]/workflows)
    - 워크플로우 실행 API (GET /api/github/repos/[owner]/[repo]/workflows/[workflowId]/runs)
    - 전체 실행 기록 API (GET /api/github/repos/[owner]/[repo]/runs)
  affects: [34-03-github-dashboard]

tech_stack:
  added: []
  patterns: [next-api-routes, zod-validation, error-handling, auth-middleware]

key_files:
  created:
    - src/app/api/github/route.ts
    - src/app/api/github/repos/route.ts
    - src/app/api/github/repos/[owner]/[repo]/route.ts
    - src/app/api/github/repos/[owner]/[repo]/commits/route.ts
    - src/app/api/github/repos/[owner]/[repo]/workflows/route.ts
    - src/app/api/github/repos/[owner]/[repo]/workflows/[workflowId]/runs/route.ts
    - src/app/api/github/repos/[owner]/[repo]/runs/route.ts
  modified: []

key_decisions:
  - "Next.js 15+ 동적 라우트: params는 Promise로 await 처리"
  - "인증 필수: 모든 API에 getAuthPayload() 사용"
  - "토큰 미노출: POST 응답에서도 hasToken boolean만 반환"
  - "에러 코드 표준화: UNAUTHORIZED, TOKEN_NOT_FOUND, RATE_LIMIT, GITHUB_API_ERROR 등"

patterns_established:
  - "GitHub API 에러 처리: 401(토큰 미설정/만료), 429(rate limit), 502(API 에러)"
  - "Zod 필터 검증: RepositoryFilterSchema, CommitFilterSchema, WorkflowRunFilterSchema"

metrics:
  duration: 8min
  completed: 2026-01-16
---

# Phase 34 Plan 02: GitHub API Routes Summary

**7개 GitHub REST API 엔드포인트 구현 - 토큰 설정 CRUD, 레포지토리/커밋/워크플로우/실행기록 조회**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-16T00:35:19Z
- **Completed:** 2026-01-16T00:43:XX
- **Tasks:** 4
- **Files created:** 7

## Accomplishments

- GitHub 토큰 설정 CRUD API 완성 (GET/POST/DELETE /api/github)
- 레포지토리 목록 및 상세 조회 API 구현
- 커밋 히스토리 조회 API 구현 (필터 지원: sha, path, author, since, until)
- 워크플로우 목록 및 실행 기록 조회 API 구현
- 전체 워크플로우 실행 기록 조회 API 추가 (/runs)

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub Settings API** - `774284c` (feat)
2. **Task 2: Repositories List API** - `c5194df` (feat)
3. **Task 3: Repository Detail & Commits API** - `ddc51a5` (feat)
4. **Task 4: Workflows & Runs API** - `53c8569` (feat)

## Files Created

| File | Description |
|------|-------------|
| `src/app/api/github/route.ts` | GitHub 설정 CRUD (GET/POST/DELETE) |
| `src/app/api/github/repos/route.ts` | 레포지토리 목록 조회 |
| `src/app/api/github/repos/[owner]/[repo]/route.ts` | 레포지토리 상세 조회 |
| `src/app/api/github/repos/[owner]/[repo]/commits/route.ts` | 커밋 히스토리 조회 |
| `src/app/api/github/repos/[owner]/[repo]/workflows/route.ts` | 워크플로우 목록 조회 |
| `src/app/api/github/repos/[owner]/[repo]/workflows/[workflowId]/runs/route.ts` | 특정 워크플로우 실행 기록 |
| `src/app/api/github/repos/[owner]/[repo]/runs/route.ts` | 전체 워크플로우 실행 기록 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/github | 현재 사용자 GitHub 설정 조회 |
| POST | /api/github | 토큰 등록/업데이트 |
| DELETE | /api/github | 연동 해제 |
| GET | /api/github/repos | 레포지토리 목록 |
| GET | /api/github/repos/[owner]/[repo] | 레포지토리 상세 |
| GET | /api/github/repos/[owner]/[repo]/commits | 커밋 히스토리 |
| GET | /api/github/repos/[owner]/[repo]/workflows | 워크플로우 목록 |
| GET | /api/github/repos/[owner]/[repo]/workflows/[id]/runs | 워크플로우 실행 기록 |
| GET | /api/github/repos/[owner]/[repo]/runs | 전체 실행 기록 |

## Decisions Made

1. **Next.js 15+ 동적 라우트 처리**
   - params가 Promise이므로 `const { owner, repo } = await params` 사용
   - 모든 동적 라우트에 일관된 RouteParams 타입 정의

2. **에러 코드 표준화**
   - UNAUTHORIZED: 인증 필요
   - TOKEN_NOT_FOUND: GitHub 토큰 미설정
   - TOKEN_EXPIRED: 토큰 만료
   - RATE_LIMIT: GitHub API rate limit
   - GITHUB_AUTH_ERROR: GitHub 인증 실패
   - GITHUB_API_ERROR: 기타 GitHub API 에러
   - NOT_FOUND: 리소스 없음
   - VALIDATION_ERROR: 입력 검증 실패

3. **추가 /runs 엔드포인트**
   - 계획에 없었으나 전체 워크플로우 실행 기록 조회 필요성으로 추가
   - workflowId 없이 모든 실행 기록 조회 지원

## Deviations from Plan

### Auto-enhanced Features

**1. [Enhancement] /runs 엔드포인트 추가**
- **계획:** 6개 API 라우트
- **실제:** 7개 API 라우트 (/runs 추가)
- **이유:** 계획에서 언급된 "workflowId 없이 전체 runs 조회" 지원 필요
- **Files:** src/app/api/github/repos/[owner]/[repo]/runs/route.ts
- **Committed in:** `53c8569`

---

**Total deviations:** 1 enhancement
**Impact on plan:** 계획에 언급된 기능의 완전한 구현. 범위 확장 아님.

## Issues Encountered

1. **빌드 에러 (Known Issue)**
   - /login 페이지에서 useSearchParams Suspense 에러
   - 본 계획 범위 밖 (untracked 파일)
   - 34-01 SUMMARY에서 이미 문서화됨
   - GitHub API 라우트 자체는 정상 컴파일

## Known Issues (Carried Forward)

1. **/login 페이지 빌드 에러**: untracked 파일, 별도 수정 필요
2. **토큰 암호화 미구현**: 현재 평문 저장, 향후 암호화 필요

## Next Phase Readiness

**34-03 Plan (GitHub Dashboard UI)에 필요:**
- [x] GitHub Settings API - 준비됨
- [x] Repositories API - 준비됨
- [x] Commits API - 준비됨
- [x] Workflows API - 준비됨
- [x] Workflow Runs API - 준비됨

**Blockers:** 없음

---
*Phase: 34-github-integration*
*Plan: 02*
*Completed: 2026-01-16*
