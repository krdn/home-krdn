# Phase 34 Discovery: GitHub Integration

**Discovery Level:** 2 (Standard Research)
**Date:** 2026-01-16
**Duration:** ~15 min

## Research Questions

1. GitHub API 인증 방식 (PAT vs GitHub App)
2. REST API vs GraphQL API 선택
3. Rate limiting 전략
4. Node.js 라이브러리 선택

## Findings

### 1. 인증 방식: Fine-grained Personal Access Token (PAT)

**비교 분석:**

| 항목 | Classic PAT | Fine-grained PAT | GitHub App |
|------|-------------|------------------|------------|
| 설정 복잡도 | 간단 | 간단 | 복잡 |
| 권한 범위 | 넓음 (scopes) | 세밀함 (per-repo) | 세밀함 |
| Rate Limit | 5,000/hr | 5,000/hr | 15,000/hr |
| 토큰 수명 | 무제한 가능 | 최대 1년 | 8시간 (자동 갱신) |
| 적합 시나리오 | 레거시 | 개인/홈서버 | 조직/SaaS |

**선택: Fine-grained PAT**
- 이유: 홈서버 대시보드 용도, 단일/소수 사용자, 설정 간소화
- 권한: Repository access (read), Actions (read), Metadata (read)
- 만료: 90일 권장 (갱신 알림 구현 고려)

**Sources:**
- [GitHub Docs: Managing PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [PAT vs GitHub App 비교](https://michaelkasingye.medium.com/github-authentication-personal-access-tokens-vs-github-apps-0f8fba446fbd)

### 2. API 선택: REST API

**비교 분석:**

| 항목 | REST API | GraphQL API |
|------|----------|-------------|
| 학습 곡선 | 낮음 | 높음 |
| 요청 효율 | 다수 요청 필요 | 단일 요청으로 복잡 데이터 |
| 타입 안전성 | octokit 제공 | 별도 codegen 필요 |
| 캐싱 | HTTP 캐싱 활용 | 별도 구현 |

**선택: REST API**
- 이유:
  - 단순 목록/조회 작업 위주
  - Octokit의 완벽한 TypeScript 지원
  - 기존 프로젝트의 REST 패턴과 일관성
- 필요 엔드포인트:
  - `repos.listForAuthenticatedUser` - 레포 목록
  - `repos.get` - 레포 상세
  - `repos.listCommits` - 커밋 히스토리
  - `actions.listRepoWorkflows` - 워크플로우 목록
  - `actions.listWorkflowRuns` - 실행 기록

**Source:**
- [GitHub Docs: REST vs GraphQL](https://docs.github.com/en/rest/about-the-rest-api/comparing-githubs-rest-api-and-graphql-api)

### 3. Rate Limiting 전략

**GitHub Rate Limits:**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour (사용 안 함)

**구현 전략:**
1. 응답 헤더 모니터링: `x-ratelimit-remaining`, `x-ratelimit-reset`
2. Octokit 기본 재시도 로직 활용 (1회 자동 재시도)
3. Rate limit 에러 시 사용자 친화적 메시지 반환
4. 프론트엔드에서 폴링 간격 조절 (최소 30초)

**에러 응답 예시:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "GitHub API 요청 한도 초과. 잠시 후 다시 시도해주세요.",
    "retryAfter": 3600
  }
}
```

### 4. 라이브러리 선택: octokit

**비교:**

| 라이브러리 | 번들 크기 | TypeScript | 유지보수 |
|-----------|----------|------------|---------|
| octokit | ~150KB | 완벽 | GitHub 공식 |
| @octokit/rest | ~80KB | 완벽 | GitHub 공식 |
| node-fetch + 직접 구현 | 최소 | 수동 | 자체 |

**선택: `octokit` (all-in-one)**
- 이유:
  - REST + GraphQL + Auth 통합
  - 완벽한 TypeScript 선언
  - 자동 재시도, 페이지네이션 플러그인
  - 서버사이드 전용이므로 번들 크기 무관

**설치:**
```bash
npm install octokit
```

**Source:**
- [octokit.js GitHub](https://github.com/octokit/octokit.js)

## Decisions

1. ✅ **인증**: Fine-grained PAT 사용 (읽기 전용 권한)
2. ✅ **API**: REST API + Octokit
3. ✅ **Rate Limiting**: Octokit 기본 + 사용자 메시지
4. ✅ **토큰 저장**: DB에 암호화 저장, 응답에 미노출

## Implementation Notes

### 토큰 보안
- accessToken은 DB에만 저장
- API 응답에는 `hasToken: boolean`만 포함
- 로그에 토큰 미포함

### 에러 코드 매핑
| GitHub Status | 내부 코드 | 메시지 |
|---------------|----------|--------|
| 401 | GITHUB_AUTH_FAILED | 토큰이 유효하지 않습니다 |
| 403 | GITHUB_FORBIDDEN | 권한이 없습니다 |
| 404 | GITHUB_NOT_FOUND | 리소스를 찾을 수 없습니다 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 한도 초과 |

### 페이지네이션
- 기본 per_page: 30 (레포), 10 (workflow runs)
- 최대 per_page: 100 (GitHub 제한)
- 프론트엔드에서 무한 스크롤 또는 페이지 네비게이션

---
*Discovery completed: 2026-01-16*
