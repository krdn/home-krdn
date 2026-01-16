---
phase: 34-github-integration
plan: 01
subsystem: github-integration
tags: [github, octokit, api, service-layer]

dependency_graph:
  requires: [phase-33-port-registry]
  provides: [github-settings-model, github-service-layer, github-types]
  affects: [34-02-github-api-routes, 34-03-github-dashboard]

tech_stack:
  added: [octokit]
  patterns: [service-layer, dto-pattern, token-validation]

key_files:
  created:
    - prisma/schema.prisma (GitHubSettings model added)
    - src/types/github.ts
    - src/lib/github-service.ts
  modified:
    - package.json (octokit dependency)
    - prisma/dev.db (schema sync)

decisions:
  - id: 34-01-01
    title: "Octokit 사용"
    choice: "octokit 패키지"
    rationale: "GitHub 공식 SDK, 타입 안전성, REST API 완전 지원"
  - id: 34-01-02
    title: "토큰 저장 방식"
    choice: "평문 저장 (현재)"
    rationale: "MVP 단계, 향후 암호화 필요"
  - id: 34-01-03
    title: "DTO 패턴"
    choice: "hasToken boolean만 노출"
    rationale: "보안 - 토큰 값 절대 미노출"

metrics:
  duration: "7m 18s"
  completed: "2026-01-16"
---

# Phase 34 Plan 01: GitHub API Infrastructure Summary

**One-liner:** Octokit 기반 GitHub API 인프라 구축 - GitHubSettings Prisma 모델, 11개 service 함수, 보안 DTO 패턴

## What Was Built

### 1. GitHubSettings Prisma 모델

```prisma
model GitHubSettings {
  id             String    @id @default(cuid())
  userId         String    @unique
  user           User      @relation(...)
  accessToken    String    // PAT 저장
  tokenExpiresAt DateTime? // 선택적 만료일
  username       String?   // GitHub 사용자명
  avatarUrl      String?   // GitHub 아바타
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

- User 모델과 1:1 관계
- 데이터베이스 드리프트 해결 후 스키마 동기화 완료

### 2. GitHub 타입 정의 (src/types/github.ts)

**API 응답 타입:**
- `GitHubRepo` - 레포지토리 정보
- `GitHubCommit` - 커밋 정보
- `GitHubWorkflow` - 워크플로우 정보
- `GitHubWorkflowRun` - 워크플로우 실행 기록
- `GitHubUser` - 사용자 정보

**DTO 타입:**
- `GitHubSettingsDto` - 클라이언트 반환용 (hasToken boolean만 노출)
- `CreateGitHubSettingsInput` - 생성 입력
- `TokenValidationResult` - 토큰 검증 결과

**Zod 스키마:**
- `CreateGitHubSettingsSchema` - PAT 형식 검증 (ghp_, github_pat_ 접두사)
- `RepositoryFilterSchema` - 레포지토리 필터
- `CommitFilterSchema` - 커밋 필터
- `WorkflowRunFilterSchema` - 워크플로우 런 필터

**유틸리티:**
- `isClassicPAT()` - Classic PAT 형식 확인
- `isFineGrainedPAT()` - Fine-grained PAT 형식 확인
- `isValidGitHubTokenFormat()` - 유효한 토큰 형식 확인

### 3. GitHub Service Layer (src/lib/github-service.ts)

**총 11개 함수 구현:**

| 함수 | 설명 |
|------|------|
| `getOctokitForUser` | 사용자 토큰으로 Octokit 인스턴스 생성 |
| `getGitHubSettings` | 사용자 GitHub 설정 조회 |
| `createGitHubSettings` | GitHub 설정 생성 (토큰 검증 포함) |
| `updateGitHubSettings` | GitHub 설정 업데이트 |
| `deleteGitHubSettings` | GitHub 설정 삭제 |
| `validateToken` | 토큰 유효성 검증 |
| `getRepositories` | 레포지토리 목록 조회 |
| `getRepository` | 특정 레포지토리 조회 |
| `getCommits` | 커밋 목록 조회 |
| `getWorkflows` | 워크플로우 목록 조회 |
| `getWorkflowRuns` | 워크플로우 실행 기록 조회 |

**보안 기능:**
- 토큰 값 절대 로그/응답에 미노출
- DTO 변환 시 `hasToken: boolean`만 제공
- Rate limit 에러 감지 및 처리
- 인증/권한/404 에러 처리

## Verification Results

- [x] `npx prisma migrate status` - Database schema is up to date
- [x] `tsc --noEmit` - github-service.ts, types/github.ts 에러 없음
- [x] 11개 함수 export 확인 (계획 9개 + 추가 2개)
- [x] 토큰이 로그나 응답에 노출되지 않음

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `695fc5c` | GitHubSettings Prisma 모델 추가 |
| Task 2 | `cae00eb` | GitHub 타입 정의 및 Zod 스키마 |
| Task 3 | `63e84cd` | GitHub Service Layer 구현 (Octokit) |

## Deviations from Plan

### Auto-enhanced Features

**1. [Enhancement] 추가 함수 구현**
- 계획: 9개 함수
- 실제: 11개 함수 (updateGitHubSettings, getOctokitForUser 추가)
- 이유: 더 완전한 CRUD 지원 및 재사용 가능한 Octokit 인스턴스 생성 함수 필요

**2. [Enhancement] 추가 Zod 스키마**
- RepositoryFilterSchema, CommitFilterSchema, WorkflowRunFilterSchema 추가
- 이유: API 호출 시 필터링 옵션 타입 안전성 확보

## Known Issues

1. **기존 테스트 파일 타입 에러**: 이번 계획 범위 밖, 별도 수정 필요
2. **/login 페이지 빌드 에러**: untracked 파일, 별도 수정 필요
3. **토큰 암호화 미구현**: 현재 평문 저장, 향후 암호화 필요

## Next Phase Readiness

**34-02 Plan (GitHub API Routes)에 필요:**
- [x] GitHubSettings Prisma 모델 - 준비됨
- [x] GitHub Service Layer - 준비됨
- [x] GitHub 타입 정의 - 준비됨
- [ ] 토큰 암호화 - 향후 필요

**Blockers:** 없음
